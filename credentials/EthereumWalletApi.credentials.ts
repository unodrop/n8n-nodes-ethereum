import type {
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class EthereumWalletApi implements ICredentialType {
	name = 'ethereumWalletApi';

	displayName = 'Ethereum Wallet API';

	icon: Icon = { light: 'file:../icons/ethereum.svg', dark: 'file:../icons/ethereum.dark.svg' };

	documentationUrl = 'https://docs.ethers.org/v6/api/wallet/';

	properties: INodeProperties[] = [
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Ethereum wallet private key (with or without 0x prefix). Keep this secret.',
		},
	];
}
