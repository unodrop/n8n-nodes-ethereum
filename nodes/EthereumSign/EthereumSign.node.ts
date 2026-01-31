import { Wallet } from 'ethers';
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
		description: 'Sign messages with an Ethereum wallet (EIP-191 personal_sign)',
		defaults: {
			name: 'Ethereum Sign',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ethereumWalletApi',
				required: true,
				testedBy: 'ethereumSign',
			},
		],
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
						description: 'Sign a message with EIP-191 personal_sign (used by MetaMask, etc.)',
						action: 'Sign a message with eip 191 personal sign used by meta mask etc',
					},
				],
				default: 'signMessage',
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
		const credentials = await this.getCredentials('ethereumWalletApi');
		const privateKey = credentials?.privateKey as string;
		if (!privateKey || !privateKey.trim()) {
			throw new NodeOperationError(this.getNode(), 'Ethereum Wallet credential is missing the private key');
		}

		const operation = this.getNodeParameter('operation', 0) as string;
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let wallet: Wallet;
		try {
			wallet = new Wallet(privateKey.trim());
		} catch (err) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid private key: ${err instanceof Error ? err.message : String(err)}`,
			);
		}

		for (let i = 0; i < items.length; i++) {
			let message: string;
			if (operation === 'signMessage') {
				const messageSource = this.getNodeParameter('messageSource', i) as string;
				if (messageSource === 'parameter') {
					message = this.getNodeParameter('message', i) as string;
				} else {
					const messageField = this.getNodeParameter('messageField', i) as string;
					const item = items[i];
					const value = item.json[messageField];
					if (value === undefined || value === null) {
						throw new NodeOperationError(
							this.getNode(),
							`Input item has no field "${messageField}" for signing`,
						);
					}
					message = typeof value === 'string' ? value : JSON.stringify(value);
				}
			} else {
				message = '';
			}

			const signature = await wallet.signMessage(message);

			returnData.push({
				json: {
					message,
					signature,
					address: wallet.address,
				},
				pairedItem: { item: i },
			});
		}

		return [returnData];
	}
}
