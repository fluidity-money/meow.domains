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
		tldAddress: '0x4087fb91A1fBdef05761C02714335D232a2Bf3a1', // TODO
		tldContract: null,
		tldChainId: 55244,
		tldChainName: 'Superposition',
		minterAddress: '0x3c02e28A5a5aA9eF83316F11dd79F4c8a1369793', // TODO
		minterContract: null,
		minterLoadingData: false,
		minterPaused: true,
		minterTldPrice1: 10,
		minterTldPrice2: 1,
		minterTldPrice3: 0.1,
		minterTldPrice4: 0.01,
		minterTldPrice5: 0.0019,
		referralFee: 1000,
		reservationsAddress: '0x1B03D6ecd88bE3B19aBe7c76a30636689cad9Bf8', // smart contract which keeps track of all reservations
		reservationsPaused: false,
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
			return Number.parseFloat(state.minterTldPrice1)
		},
		getMinterTldPrice2(state) {
			return Number.parseFloat(state.minterTldPrice2)
		},
		getMinterTldPrice3(state) {
			return Number.parseFloat(state.minterTldPrice3)
		},
		getMinterTldPrice4(state) {
			return Number.parseFloat(state.minterTldPrice4)
		},
		getMinterTldPrice5(state) {
			return Number.parseFloat(state.minterTldPrice5)
		},
		getReferralFee(state) {
			return state.referralFee
		},
		getReservationsAddress(state) {
			return state.reservationsAddress
		},
		getReservationsPaused(state) {
			return state.reservationsPaused
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
		setReservationsPaused(state, paused) {
			state.reservationsPaused = paused
		}
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

			// check if reservations are paused
			const reservationsPaused = await minterContract.pausedReservations()
			commit('setReservationsPaused', reservationsPaused)

			commit('setMinterLoadingData', false)
		},
	},
}
