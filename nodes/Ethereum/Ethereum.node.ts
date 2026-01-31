import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

const ERC20_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function decimals() view returns (uint8)',
] as const;

export class Ethereum implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ethereum',
		name: 'ethereum',
		icon: { light: 'file:../../icons/ethereum.svg', dark: 'file:../../icons/ethereum.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Transfer ETH/ERC20, query balance, query gas. Requires RPC URL.',
		defaults: {
			name: 'Ethereum',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Balance',
						value: 'getBalance',
						description: 'Get native ETH balance',
						action: 'Get native ETH balance',
					},
					{
						name: 'Get ERC20 Balance',
						value: 'getERC20Balance',
						description: 'Get ERC20 token balance',
						action: 'Get ERC20 token balance',
					},
					{
						name: 'Get Gas',
						value: 'getGas',
						description: 'Get current gas price / fee data',
						action: 'Get current gas price / fee data',
					},
					{
						name: 'Transfer (ETH)',
						value: 'transfer',
						description: 'Send native ETH',
						action: 'Send native ETH',
					},
					{
						name: 'Transfer ERC20',
						value: 'transferERC20',
						description: 'Send ERC20 tokens',
						action: 'Send ERC20 tokens',
					},
				],
				default: 'transfer',
			},
			{
				displayName: 'RPC URL',
				name: 'rpcUrl',
				type: 'string',
				default: '',
				placeholder: 'https://eth.llamarpc.com',
				description: 'JSON-RPC endpoint (required for all operations)',
				required: true,
			},
			{
				displayName: 'Chain ID',
				name: 'chainId',
				type: 'number',
				default: 1,
				description: 'Chain ID (1 = Ethereum, 137 = Polygon, 56 = BSC, etc.)',
			},
			// --- Transfer (ETH) ---
			{
				displayName: 'Private Key Field',
				name: 'privateKeyField',
				type: 'string',
				default: 'privateKey',
				displayOptions: { show: { operation: ['transfer', 'transferERC20'] } },
				description: 'JSON key of each item that contains the sender private key (batch supported)',
			},
			{
				displayName: 'To Address',
				name: 'toAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { operation: ['transfer', 'transferERC20'] } },
				description: 'Recipient address',
				required: true,
			},
			{
				displayName: 'To Address Source',
				name: 'toAddressSource',
				type: 'options',
				default: 'parameter',
				displayOptions: { show: { operation: ['transfer', 'transferERC20'] } },
				options: [
					{ name: 'From Parameter', value: 'parameter' },
					{ name: 'From Input Data', value: 'input' },
				],
			},
			{
				displayName: 'To Address Field',
				name: 'toAddressField',
				type: 'string',
				default: 'to',
				displayOptions: { show: { operation: ['transfer', 'transferERC20'], toAddressSource: ['input'] } },
			},
			{
				displayName: 'Amount (ETH)',
				name: 'valueWei',
				type: 'string',
				default: '0',
				displayOptions: { show: { operation: ['transfer'] } },
				description: 'Amount in ETH (e.g. 0.01) or in wei if value is very large',
				required: true,
			},
			{
				displayName: 'Amount Source',
				name: 'valueSource',
				type: 'options',
				default: 'parameter',
				displayOptions: { show: { operation: ['transfer'] } },
				options: [
					{ name: 'From Parameter', value: 'parameter' },
					{ name: 'From Input Data', value: 'input' },
				],
			},
			{
				displayName: 'Amount Field',
				name: 'valueField',
				type: 'string',
				default: 'amount',
				displayOptions: { show: { operation: ['transfer'], valueSource: ['input'] } },
			},
			// --- Transfer ERC20 ---
			{
				displayName: 'Token Contract Address',
				name: 'tokenAddress',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { operation: ['transferERC20', 'getERC20Balance'] } },
				required: true,
			},
			{
				displayName: 'Amount (Human)',
				name: 'erc20Amount',
				type: 'string',
				default: '0',
				displayOptions: { show: { operation: ['transferERC20'] } },
				description: 'Token amount in human units (e.g. 1.5). Uses token decimals.',
				required: true,
			},
			{
				displayName: 'ERC20 Amount Source',
				name: 'erc20AmountSource',
				type: 'options',
				default: 'parameter',
				displayOptions: { show: { operation: ['transferERC20'] } },
				options: [
					{ name: 'From Parameter', value: 'parameter' },
					{ name: 'From Input Data', value: 'input' },
				],
			},
			{
				displayName: 'ERC20 Amount Field',
				name: 'erc20AmountField',
				type: 'string',
				default: 'amount',
				displayOptions: { show: { operation: ['transferERC20'], erc20AmountSource: ['input'] } },
			},
			{
				displayName: 'Token Decimals',
				name: 'tokenDecimals',
				type: 'number',
				default: 18,
				displayOptions: { show: { operation: ['transferERC20'] } },
				description: 'Token decimals (default 18). Used when amount is from parameter.',
			},
			// --- Get Balance ---
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { operation: ['getBalance'] } },
				description: 'Address to query native balance',
				required: true,
			},
			{
				displayName: 'Address Source',
				name: 'addressSource',
				type: 'options',
				default: 'parameter',
				displayOptions: { show: { operation: ['getBalance'] } },
				options: [
					{ name: 'From Parameter', value: 'parameter' },
					{ name: 'From Input Data', value: 'input' },
				],
			},
			{
				displayName: 'Address Field',
				name: 'addressField',
				type: 'string',
				default: 'address',
				displayOptions: { show: { operation: ['getBalance'], addressSource: ['input'] } },
			},
			// --- Get ERC20 Balance ---
			{
				displayName: 'Address (ERC20)',
				name: 'addressErc20',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: { show: { operation: ['getERC20Balance'] } },
				required: true,
			},
			{
				displayName: 'Address Source (ERC20)',
				name: 'addressSourceErc20',
				type: 'options',
				default: 'parameter',
				displayOptions: { show: { operation: ['getERC20Balance'] } },
				options: [
					{ name: 'From Parameter', value: 'parameter' },
					{ name: 'From Input Data', value: 'input' },
				],
			},
			{
				displayName: 'Address Field (ERC20)',
				name: 'addressFieldErc20',
				type: 'string',
				default: 'address',
				displayOptions: { show: { operation: ['getERC20Balance'], addressSourceErc20: ['input'] } },
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const rpcUrl = (this.getNodeParameter('rpcUrl', 0) as string)?.trim();
		if (!rpcUrl) {
			throw new NodeOperationError(this.getNode(), 'RPC URL is required');
		}

		let provider: JsonRpcProvider;
		try {
			provider = new JsonRpcProvider(rpcUrl);
			await provider.getNetwork();
		} catch (err) {
			throw new NodeOperationError(
				this.getNode(),
				`RPC failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		}

		const chainIdParam = this.getNodeParameter('chainId', 0) as number | undefined;
		const chainId = chainIdParam != null && chainIdParam > 0 ? Number(chainIdParam) : 1;

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get Gas: single output, no need for input items
		if (operation === 'getGas') {
			const feeData = await provider.getFeeData();
			const block = await provider.getBlock('latest');
			returnData.push({
				json: {
					chainId,
					gasPrice: feeData.gasPrice ? feeData.gasPrice.toString() : null,
					maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.toString() : null,
					maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
						? feeData.maxPriorityFeePerGas.toString()
						: null,
					blockNumber: block?.number?.toString() ?? null,
					blockTimestamp: block?.timestamp ?? null,
				},
				pairedItem: { item: 0 },
			});
			return [returnData];
		}

		// Operations that run per item (or single item when no input)
		const workItems = items.length > 0 ? items : [{ json: {} }];

		const getItemValue = (item: INodeExecutionData, key: string) =>
			(item.json as Record<string, unknown>)[key];

		for (let i = 0; i < workItems.length; i++) {
			const item = workItems[i];

			if (operation === 'transfer') {
				const privateKeyField = this.getNodeParameter('privateKeyField', i) as string;
				const pkRaw = getItemValue(item, privateKeyField);
				if (pkRaw === undefined || pkRaw === null) {
					throw new NodeOperationError(
						this.getNode(),
						`Item ${i + 1}: missing field "${privateKeyField}" (private key)`,
					);
				}
				const privateKey = typeof pkRaw === 'string' ? pkRaw : String(pkRaw);
				const toAddressSource = this.getNodeParameter('toAddressSource', i) as string;
				const toAddress =
					toAddressSource === 'parameter'
						? (this.getNodeParameter('toAddress', i) as string)
						: (getItemValue(item, this.getNodeParameter('toAddressField', i) as string) as string);
				const valueSource = this.getNodeParameter('valueSource', i) as string;
				let valueStr: string;
				if (valueSource === 'parameter') {
					valueStr = this.getNodeParameter('valueWei', i) as string;
				} else {
					const v = getItemValue(item, this.getNodeParameter('valueField', i) as string);
					valueStr = v != null ? String(v) : '0';
				}
				const valueWei = valueStr.includes('.') ? BigInt(Math.floor(parseFloat(valueStr) * 1e18)) : BigInt(valueStr);

				const wallet = new Wallet(privateKey.trim(), provider);
				const tx = await wallet.sendTransaction({
					to: toAddress,
					value: valueWei,
				});
				const receipt = await tx.wait();

				returnData.push({
					json: {
						chainId,
						hash: tx.hash,
						from: tx.from,
						to: toAddress,
						value: valueWei.toString(),
						blockNumber: receipt?.blockNumber?.toString(),
						status: receipt?.status,
					},
					pairedItem: { item: i },
				});
			} else if (operation === 'transferERC20') {
				const privateKeyField = this.getNodeParameter('privateKeyField', i) as string;
				const pkRaw = getItemValue(item, privateKeyField);
				if (pkRaw === undefined || pkRaw === null) {
					throw new NodeOperationError(
						this.getNode(),
						`Item ${i + 1}: missing field "${privateKeyField}" (private key)`,
					);
				}
				const privateKey = typeof pkRaw === 'string' ? pkRaw : String(pkRaw);
				const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
				const toAddressSource = this.getNodeParameter('toAddressSource', i) as string;
				const toAddress =
					toAddressSource === 'parameter'
						? (this.getNodeParameter('toAddress', i) as string)
						: (getItemValue(item, this.getNodeParameter('toAddressField', i) as string) as string);
				const amountSource = this.getNodeParameter('erc20AmountSource', i) as string;
				let amountHuman: string;
				if (amountSource === 'parameter') {
					amountHuman = this.getNodeParameter('erc20Amount', i) as string;
				} else {
					const a = getItemValue(item, this.getNodeParameter('erc20AmountField', i) as string);
					amountHuman = a != null ? String(a) : '0';
				}
				const decimals = (this.getNodeParameter('tokenDecimals', i) as number) || 18;
				const amountWei = BigInt(Math.floor(parseFloat(amountHuman) * 10 ** decimals));

				const contract = new Contract(tokenAddress, ERC20_ABI, provider);
				const wallet = new Wallet(privateKey.trim(), provider);
				const contractWithSigner = contract.connect(wallet) as Contract;
				const tx = await contractWithSigner.transfer(toAddress, amountWei);
				const receipt = await tx.wait();

				returnData.push({
					json: {
						chainId,
						hash: tx.hash,
						from: wallet.address,
						to: toAddress,
						tokenAddress,
						amount: amountWei.toString(),
						amountHuman: amountHuman,
						blockNumber: receipt?.blockNumber?.toString(),
						status: receipt?.status,
					},
					pairedItem: { item: i },
				});
			} else if (operation === 'getBalance') {
				const addressSource = this.getNodeParameter('addressSource', i) as string;
				const address =
					addressSource === 'parameter'
						? (this.getNodeParameter('address', i) as string)
						: (getItemValue(item, this.getNodeParameter('addressField', i) as string) as string);
				if (!address) {
					throw new NodeOperationError(this.getNode(), `Item ${i + 1}: address is required`);
				}
				const balance = await provider.getBalance(address);

				returnData.push({
					json: {
						chainId,
						address,
						balanceWei: balance.toString(),
						balanceEth: (Number(balance) / 1e18).toString(),
					},
					pairedItem: { item: i },
				});
			} else if (operation === 'getERC20Balance') {
				const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
				const addressSource = this.getNodeParameter('addressSourceErc20', i) as string;
				const address =
					addressSource === 'parameter'
						? (this.getNodeParameter('addressErc20', i) as string)
						: (getItemValue(item, this.getNodeParameter('addressFieldErc20', i) as string) as string);
				if (!address) {
					throw new NodeOperationError(this.getNode(), `Item ${i + 1}: address is required`);
				}

				const contract = new Contract(tokenAddress, ERC20_ABI, provider);
				const [balance, decimals] = await Promise.all([
					contract.balanceOf(address),
					contract.decimals(),
				]);
				const d = Number(decimals);
				const balanceHuman = (Number(balance) / 10 ** d).toString();

				returnData.push({
					json: {
						chainId,
						address,
						tokenAddress,
						balanceWei: balance.toString(),
						balanceHuman,
						decimals: d,
					},
					pairedItem: { item: i },
				});
			}
		}

		return [returnData];
	}
}
