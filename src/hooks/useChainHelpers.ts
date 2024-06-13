import { ethers } from 'ethers'

export default function useChainHelpers() {
	function getChainId() {
		return 98985;
	}

	function getChainName(chainId) {
		if (chainId === 1) {
			return 'Ethereum'
		} else if (chainId === getChainId()) {
			return 'Superposition Testnet'
		} else {
			return 'Unsupported Network'
		}
	}

	function getFallbackProvider(networkId) {
		let urls

		if (networkId === 1) {
			urls = ['https://1rpc.io/eth']
		} else if (networkId === getChainId()) {
			urls = ['https://testnet-rpc.superposition.so/']
		}

		if (urls) {
			const providers = urls.map(url => new ethers.providers.JsonRpcProvider(url))
			return new ethers.providers.FallbackProvider(providers, 1) // return fallback provider
		} else {
			return null
		}
	}

	function switchNetwork(networkName) {
		let method
		let params

		if (networkName == 'Ethereum') {
			method = 'wallet_switchEthereumChain'
			params = [{ chainId: '0x1' }]
		} else if (networkName == 'Superposition Testnet') {
			method = 'wallet_addEthereumChain'
			params = [
				{
					blockExplorerUrls: ['https://testnet-explorer.superposition.so/'],
					chainId: ethers.utils.hexValue(getChainId()),
					chainName: networkName,
					nativeCurrency: { decimals: 18, name: 'SPN', symbol: 'SPN' },
					rpcUrls: ['https://testnet-rpc.superposition.so/'],
				},
			]
		}

		return {
			method: method,
			params: params,
		}
	}

	// RETURN
	return {
		getChainName,
		getFallbackProvider,
		switchNetwork,
	}
}
