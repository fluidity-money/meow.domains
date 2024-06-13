import { ethers } from 'ethers'
import tldAbi from '../../abi/PunkTLD.json'
import MinterAbi from '../../abi/Minter.json'
import useChainHelpers from '../../hooks/useChainHelpers'

const { getFallbackProvider } = useChainHelpers()

export default {
	namespaced: true,

	state: () => ({
		discountPercentage: 0,
		tldName: '.meow',
		tldAddress: '0xe0789b1AEA5a53673aDD3822Cb8bFEB5c48D8F71', // TODO
		tldContract: null,
		tldChainId: 98985,
		tldChainName: 'Superposition Testnet',
		minterAddress: '0xb29e981343daa6ea18D58cdB0800DFE962aA53e4', // TODO
		minterContract: null,
		minterLoadingData: false,
		minterPaused: true,
		minterTldPrice1: 100000,
		minterTldPrice2: 10000,
		minterTldPrice3: 1000,
		minterTldPrice4: 100,
		minterTldPrice5: 1,
		referralFee: 1000,
	}),

	getters: {
		getMinterDiscountPercentage(state) {
			return state.discountPercentage
		},
		getTldAddress(state) {
			return state.tldAddress
		},
		getTldContract(state) {
			return state.tldContract
		},
		getTldChainId(state) {
			return state.tldChainId
		},
		getTldChainName(state) {
			return state.tldChainName
		},
		getTldName(state) {
			return state.tldName
		},
		getMinterAddress(state) {
			return state.minterAddress
		},
		getMinterContract(state) {
			return state.minterContract
		},
		getMinterLoadingData(state) {
			return state.minterLoadingData
		},
		getMinterPaused(state) {
			return state.minterPaused
		},
		getMinterTldPrice1(state) {
			return state.minterTldPrice1
		},
		getMinterTldPrice2(state) {
			return state.minterTldPrice2
		},
		getMinterTldPrice3(state) {
			return state.minterTldPrice3
		},
		getMinterTldPrice4(state) {
			return state.minterTldPrice4
		},
		getMinterTldPrice5(state) {
			return state.minterTldPrice5
		},
		getReferralFee(state) {
			return state.referralFee
		},
	},

	mutations: {
		setTldContract(state) {
			let fProvider = getFallbackProvider(state.tldChainId)

			const tldIntfc = new ethers.utils.Interface(tldAbi)
			state.tldContract = new ethers.Contract(state.tldAddress, tldIntfc, fProvider)
		},

		setMinterContract(state, contract) {
			state.minterContract = contract
		},

		setDiscountPercentage(state, percentage) {
			state.discountPercentage = percentage
		},

		setMinterLoadingData(state, loading) {
			state.minterLoadingData = loading
		},

		setMinterPaused(state, paused) {
			state.minterPaused = paused
		},

		setMinterTldPrice1(state, price) {
			state.minterTldPrice1 = price
		},
		setMinterTldPrice2(state, price) {
			state.minterTldPrice2 = price
		},
		setMinterTldPrice3(state, price) {
			state.minterTldPrice3 = price
		},
		setMinterTldPrice4(state, price) {
			state.minterTldPrice4 = price
		},
		setMinterTldPrice5(state, price) {
			state.minterTldPrice5 = price
		},
		setReferralFee(state, fee) {
			state.referralFee = Number(fee)
		},
	},

	actions: {
		async fetchMinterContractData({ commit, state }) {
			commit('setMinterLoadingData', true)

			let fProvider = getFallbackProvider(state.tldChainId)

			// minter contract
			const minterIntfc = new ethers.utils.Interface(MinterAbi)
			const minterContract = new ethers.Contract(state.minterAddress, minterIntfc, fProvider)

			// check if TLD contract is paused
			const paused = await minterContract.paused()
			commit('setMinterPaused', paused)

			// get price for 1 char
			const priceWei1 = await minterContract.price1char()
			const domainPrice1 = ethers.utils.formatEther(priceWei1)
			commit('setMinterTldPrice1', domainPrice1)
			// get price for 2 chars
			const priceWei2 = await minterContract.price2char()
			const domainPrice2 = ethers.utils.formatEther(priceWei2)
			commit('setMinterTldPrice2', domainPrice2)
			// get price for 3 chars
			const priceWei3 = await minterContract.price3char()
			const domainPrice3 = ethers.utils.formatEther(priceWei3)
			commit('setMinterTldPrice3', domainPrice3)
			// get price for 4 chars
			const priceWei4 = await minterContract.price4char()
			const domainPrice4 = ethers.utils.formatEther(priceWei4)
			commit('setMinterTldPrice4', domainPrice4)
			// get price for 5 chars
			const priceWei5 = await minterContract.price5char()
			const domainPrice5 = ethers.utils.formatEther(priceWei5)
			commit('setMinterTldPrice5', domainPrice5)

			// fetch referral fee
			const refFee = await minterContract.referralFee()
			commit('setReferralFee', refFee)

			commit('setMinterLoadingData', false)
		},
	},
}
