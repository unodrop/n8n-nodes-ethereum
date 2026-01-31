import { Wallet } from 'ethers';
import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

export class EthereumCreateWallet implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ethereum Create Wallet',
		name: 'ethereumCreateWallet',
		icon: { light: 'file:../../icons/ethereum.svg', dark: 'file:../../icons/ethereum.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create a new Ethereum wallet (address, private key, mnemonic phrase)',
		defaults: {
			name: 'Ethereum Create Wallet',
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
						name: 'Create Wallet',
						value: 'createWallet',
						description: 'Generate a new random wallet (BIP-39 mnemonic + address + private key)',
						action: 'Generate a new random wallet bip 39 mnemonic address private key',
					},
				],
				default: 'createWallet',
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				typeOptions: { min: 1, max: 100 },
				default: 1,
				description: 'Number of wallets to create (each output item = one wallet)',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const count = this.getNodeParameter('count', 0) as number;

		if (operation !== 'createWallet') {
			return [[]];
		}

		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < count; i++) {
			const wallet = Wallet.createRandom();

			const address = wallet.address;
			const privateKey = wallet.privateKey;
			const mnemonic =
				wallet.mnemonic?.phrase ?? '';

			returnData.push({
				json: {
					address,
					privateKey,
					mnemonic,
				},
				pairedItem: { item: i },
			});
		}

		return [returnData];
	}
}
