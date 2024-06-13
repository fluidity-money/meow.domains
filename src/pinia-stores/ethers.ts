import { defineStore } from 'pinia'
import { ethers } from 'ethers'
import { computed, markRaw } from 'vue'
import { useVueDapp } from '@vue-dapp/core'

export const useEthersStore = defineStore('ethers', {
	state: () => ({
		provider: null,
		signer: null,
		balance: 0n,
	}),
	actions: {
		async setWallet(_provider) {
			this.provider = markRaw(new ethers.providers.Web3Provider(_provider))
			this.signer = markRaw(this.provider.getSigner())
		},

		resetWallet() {
			this.provider = null
			this.signer = null
			this.balance = 0n
		},

		async fetchBalance() {
			const { isConnected } = useVueDapp()
			if (!isConnected.value) return

			this.balance = (await this.signer.getBalance()).toBigInt()
		},
	},
})

export function useEthers() {
	const ethersStore = useEthersStore()

	return {
		...useVueDapp(),
		provider: computed(() => ethersStore.provider),
		signer: computed(() => ethersStore.signer),
		balance: computed(() => ethersStore.balance),
		setWallet: ethersStore.setWallet,
		resetWallet: ethersStore.resetWallet,
		fetchBalance: ethersStore.fetchBalance,
	}
}
