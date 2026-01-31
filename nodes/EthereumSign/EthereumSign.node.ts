import { JsonRpcProvider, Wallet } from 'ethers';
import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

export class EthereumSign implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ethereum Sign',
		name: 'ethereumSign',
		icon: { light: 'file:../../icons/ethereum.svg', dark: 'file:../../icons/ethereum.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Sign messages with an Ethereum wallet (EIP-191 personal_sign). Optional RPC URL and Chain ID for network binding and validation.',
		defaults: {
			name: 'Ethereum Sign',
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
						name: 'Sign Message',
						value: 'signMessage',
						description:
							'Sign a message with EIP-191 personal_sign (off-chain, no RPC). Used by MetaMask, login-with-signature, etc.',
						action: 'Sign a message with eip 191 personal sign used by meta mask etc',
					},
				],
				default: 'signMessage',
			},
			{
				displayName: 'Private Key Field',
				name: 'privateKeyField',
				type: 'string',
				default: 'privateKey',
				description: 'JSON key of each item that contains the wallet private key (supports batch: each item can use a different key)',
			},
			{
				displayName: 'RPC URL',
				name: 'rpcUrl',
				type: 'string',
				default: '',
				placeholder: 'https://eth.llamarpc.com',
				description: 'Optional JSON-RPC endpoint (e.g. Ethereum mainnet, Polygon). Used to bind wallet to chain and validate Chain ID.',
			},
			{
				displayName: 'Chain ID',
				name: 'chainId',
				type: 'number',
				default: 1,
				description:
					'Chain ID (1 = Ethereum mainnet, 137 = Polygon, 56 = BSC, etc.). If RPC URL is set, will validate that the network matches this Chain ID.',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: { operation: ['signMessage'] },
				},
				description: 'The message to sign (plain text). Will be prefixed with "\\x19Ethereum Signed Message:\\n" per EIP-191.',
			},
			{
				displayName: 'Message Source',
				name: 'messageSource',
				type: 'options',
				default: 'parameter',
				displayOptions: {
					show: { operation: ['signMessage'] },
				},
				options: [
					{
						name: 'From Parameter',
						value: 'parameter',
						description: 'Use the Message field above',
					},
					{
						name: 'From Input Data',
						value: 'input',
						description: 'Use a field from the incoming item (e.g. {{ $JSON.message }})',
					},
				],
			},
			{
				displayName: 'Message Field',
				name: 'messageField',
				type: 'string',
				default: 'message',
				displayOptions: {
					show: { operation: ['signMessage'], messageSource: ['input'] },
				},
				description: 'JSON key of the incoming item that contains the message to sign',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const privateKeyField = this.getNodeParameter('privateKeyField', 0) as string;
		const rpcUrl = (this.getNodeParameter('rpcUrl', 0) as string)?.trim() || '';
		const chainIdParam = this.getNodeParameter('chainId', 0) as number | undefined;
		const chainId = chainIdParam != null && chainIdParam > 0 ? Number(chainIdParam) : 1;
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let provider: JsonRpcProvider | null = null;
		if (rpcUrl) {
			try {
				provider = new JsonRpcProvider(rpcUrl);
				const network = await provider.getNetwork();
				const networkChainId = Number(network.chainId);
				if (chainId !== networkChainId) {
					throw new NodeOperationError(
						this.getNode(),
						`Chain ID mismatch: node is set to ${chainId} but RPC (${rpcUrl}) returned chainId ${networkChainId}. Fix RPC URL or Chain ID.`,
					);
				}
			} catch (err) {
				if (err instanceof NodeOperationError) throw err;
				throw new NodeOperationError(
					this.getNode(),
					`RPC failed: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		}

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const privateKeyRaw = item.json[privateKeyField];
			if (privateKeyRaw === undefined || privateKeyRaw === null) {
				throw new NodeOperationError(
					this.getNode(),
					`Item ${i + 1} has no field "${privateKeyField}" (private key). Use "Private Key Field" to set the key name, or ensure each item has that field.`,
				);
			}
			const privateKey = typeof privateKeyRaw === 'string' ? privateKeyRaw : String(privateKeyRaw);
			if (!privateKey.trim()) {
				throw new NodeOperationError(this.getNode(), `Item ${i + 1}: private key is empty`);
			}

			let wallet: Wallet;
			try {
				wallet = provider ? new Wallet(privateKey.trim(), provider) : new Wallet(privateKey.trim());
			} catch (err) {
				throw new NodeOperationError(
					this.getNode(),
					`Item ${i + 1} invalid private key: ${err instanceof Error ? err.message : String(err)}`,
				);
			}

			let message: string;
			if (operation === 'signMessage') {
				const messageSource = this.getNodeParameter('messageSource', i) as string;
				if (messageSource === 'parameter') {
					message = this.getNodeParameter('message', i) as string;
				} else {
					const messageField = this.getNodeParameter('messageField', i) as string;
					const value = item.json[messageField];
					if (value === undefined || value === null) {
						throw new NodeOperationError(
							this.getNode(),
							`Item ${i + 1} has no field "${messageField}" for message`,
						);
					}
					message = typeof value === 'string' ? value : JSON.stringify(value);
				}
			} else {
				message = '';
			}

			const signature = await wallet.signMessage(message);

			const signedAt = new Date();
			returnData.push({
				json: {
					message,
					signature,
					address: wallet.address,
					signedAt: signedAt.toISOString(),
					signedAtUnix: Math.floor(signedAt.getTime() / 1000),
					...(chainId > 0 && { chainId }),
				},
				pairedItem: { item: i },
			});
		}

		return [returnData];
	}
}
