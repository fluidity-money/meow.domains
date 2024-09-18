import { ethers } from 'ethers'
import MinterAbi from '../../abi/Minter.json'
import TldAbi from '../../abi/PunkTLD.json'
import { useVueDapp, shortenAddress } from '@vue-dapp/core'
import { useEthers } from '../../pinia-stores/ethers'
import { storeToRefs } from 'pinia'

export default {
	namespaced: true,

	state: () => ({
		canUserBuy: true, // set to true, because anyone can mint a domain now (before only NFT holders were eligible)
		discountEligible: false,
		isTldAdmin: false,
		isMinterAdmin: false,
		isRoyaltyFeeUpdater: false,
		nftAddress: '', // not relevant for this specific case
		selectedName: null, // domain name that appears as the main profile name
		selectedNameData: null,
		selectedNameImageSvg: null,
		selectedNameKey: null,
		tokenAddress: '',
		tokenContract: null,
		tokenAllowance: 0, // user's allowance for wrapper contract
		tokenBalance: 0, // user's balance
		tokenName: 'ETH',
		tokenDecimals: 18,
		userAddress: null,
		userAllDomainNames: [], // all domain names of current user (default + manually added)
		userDomainNamesKey: null,
		userShortAddress: null,
		userBalanceWei: 0, // ETH balance in wei
		userBalance: 0, // ETH balance
	}),

	getters: {
		getCanUserBuy(state) {
			return state.canUserBuy
		},
		getDiscountEligible(state) {
			return state.discountEligible
		},
		getUserAddress(state) {
			return state.userAddress
		},
		getUserBalance(state) {
			return state.userBalance
		},
		getUserBalanceWei(state) {
			return state.userBalanceWei
		},
		getUserAllDomainNames(state) {
			return state.userAllDomainNames
		},
		getUserSelectedName(state) {
			return state.selectedName
		},
		getUserSelectedNameData(state) {
			return state.selectedNameData
		},
		getUserSelectedNameImageSvg(state) {
			return state.selectedNameImageSvg
		},
		getUserShortAddress(state) {
			return state.userShortAddress
		},
		getPaymentTokenAddress(state) {
			return state.tokenAddress
		},
		getPaymentTokenAllowance(state) {
			return state.tokenAllowance
		},
		getPaymentTokenBalance(state) {
			return state.tokenBalance
		},
		getPaymentTokenContract(state) {
			return state.tokenContract
		},
		getPaymentTokenName(state) {
			return state.tokenName
		},
		getPaymentTokenDecimals(state) {
			return state.tokenDecimals
		},
		isUserRoyaltyFeeUpdater(state) {
			return state.isRoyaltyFeeUpdater
		},
		isUserMinterAdmin(state) {
			return state.isMinterAdmin
		},
		isUserTldAdmin(state) {
			return state.isTldAdmin
		},
	},

	mutations: {
		addDomainManually(state, domainName) {
			const { address, chainId } = useVueDapp()

			let userDomainNames = []

			if (address.value) {
				state.userDomainNamesKey =
					'userDomainNames' + String(chainId.value) + String(shortenAddress(address.value))
				state.selectedNameKey = 'selectedName' + String(chainId.value) + String(shortenAddress(address.value))

				if (localStorage.getItem(state.userDomainNamesKey)) {
					userDomainNames = JSON.parse(localStorage.getItem(state.userDomainNamesKey))
				}

				if (!userDomainNames.includes(domainName)) {
					userDomainNames.push(domainName)
				}

				for (let udName of userDomainNames) {
					if (!state.userAllDomainNames.includes(udName)) {
						state.userAllDomainNames.push(udName)
					}
				}

				localStorage.setItem(state.userDomainNamesKey, JSON.stringify(userDomainNames))
			}
		},

		setUserData(state) {
			const { address } = useVueDapp()
			const { balance } = useEthers()

			state.userAddress = address.value
			state.userShortAddress = shortenAddress(address.value)
			state.userBalanceWei = balance.value
			state.userBalance = ethers.utils.formatEther(balance.value)
		},

		setCanUserBuy(state, canBuy) {
			state.canUserBuy = canBuy
		},

		setCanGetDiscount(state, eligible) {
			state.discountEligible = eligible
		},

		setDefaultName(state, defName) {
			if (!state.userAllDomainNames.includes(defName)) {
				state.userAllDomainNames.push(defName)
			}
		},

		setIsRoyaltyFeeUpdater(state, admin) {
			state.isRoyaltyFeeUpdater = admin
		},

		setIsMinterAdmin(state, admin) {
			state.isMinterAdmin = admin
		},

		setIsTldAdmin(state, admin) {
			state.isTldAdmin = admin
		},

		setSelectedName(state, selectedName) {
			state.selectedName = selectedName
			localStorage.setItem(state.selectedNameKey, state.selectedName)
			localStorage.setItem('connected', 'metamask')
		},

		setSelectedNameKey(state, selectedNameKey) {
			state.selectedNameKey = selectedNameKey
		},

		setSelectedNameData(state, nameData) {
			state.selectedNameData = nameData
		},

		setSelectedNameImageSvg(state, imageSvg) {
			state.selectedNameImageSvg = imageSvg
		},

		setUserDomainNamesKey(state, key) {
			state.userDomainNamesKey = key
		},

		setPaymentTokenAllowance(state, allowance) {
			state.tokenAllowance = allowance
		},

		setPaymentTokenBalance(state, balance) {
			state.tokenBalance = balance
		},

		setPaymentTokenContract(state, contract) {
			state.tokenContract = contract
		},

		setUserAllDomainNames(state, domains) {
			state.userAllDomainNames = domains
		},
	},

	actions: {
		async checkIfAdmin({ commit, rootGetters }) {
			const { address } = useVueDapp()
			const { signer } = useEthers()

			if (address.value) {
				// check if user has any admin privileges
				const minterIntfc = new ethers.utils.Interface([
					'function owner() public view returns (address)',
					'function isManager(address) public view returns (bool)',
				])

				const minterContract = new ethers.Contract(
					rootGetters['tld/getMinterAddress'],
					minterIntfc,
					signer.value,
				)

				const minterAdmin = await minterContract.owner()

				if (String(minterAdmin).toLowerCase() === String(address.value).toLowerCase()) {
					commit('setIsMinterAdmin', true)
				} else {
					commit('setIsMinterAdmin', false)
				}

				if (String(minterAdmin).toLowerCase() != String(address.value).toLowerCase()) {
					// check if current user is manager of the minter contract
					const isManager = await minterContract.isManager(address.value)

					if (isManager) {
						commit('setIsMinterAdmin', true)
					} else {
						commit('setIsMinterAdmin', false)
					}
				}

				// check if user has any admin privileges
				const tldIntfc = new ethers.utils.Interface(TldAbi)
				const tldContract = new ethers.Contract(rootGetters['tld/getTldAddress'], tldIntfc, signer.value)

				const tldAdmin = await tldContract.owner()

				if (String(tldAdmin).toLowerCase() === String(address.value).toLowerCase()) {
					commit('setIsTldAdmin', true)
				} else {
					commit('setIsTldAdmin', false)
				}
			}
		},

		async fetchUserDomainNames({ dispatch, commit, state, rootState, rootGetters }, newAccount) {
			let userDomainNames = []
			let userDomainNamesKey = null
			let selectedNameKey = null

			const { address, chainId } = useVueDapp()
			const { signer } = useEthers()

			if (address.value) {
				dispatch('fetchCanUserBuy')

				userDomainNamesKey = 'userDomainNames' + String(chainId.value) + String(shortenAddress(address.value))
				selectedNameKey = 'selectedName' + String(chainId.value) + String(shortenAddress(address.value))

				commit('setSelectedNameKey', selectedNameKey)
				commit('setUserDomainNamesKey', userDomainNamesKey)

				// reset user data in case there's a switch between accounts
				if (newAccount) {
					if (
						localStorage.getItem(selectedNameKey) &&
						localStorage.getItem(selectedNameKey) !== String(null)
					) {
						commit('setSelectedName', localStorage.getItem(selectedNameKey))
					} else {
						commit('setSelectedName', null)
						commit('setSelectedNameData', null)
						commit('setSelectedNameImageSvg', null)
					}

					commit('setUserAllDomainNames', [])
				}

				if (localStorage.getItem(userDomainNamesKey)) {
					userDomainNames = JSON.parse(localStorage.getItem(userDomainNamesKey))
				}

				for (let udName of userDomainNames) {
					commit('setDefaultName', udName)
				}

				// fetch user's default name
				const intfc = new ethers.utils.Interface(rootGetters['punk/getTldAbi'])
				const contract = new ethers.Contract(rootGetters['tld/getTldAddress'], intfc, signer.value)

				const userDefaultName = await contract.defaultNames(address.value)

				if (userDefaultName) {
					commit('setDefaultName', userDefaultName + rootState.tld.tldName)

					if (!userDomainNames.includes(userDefaultName + rootState.tld.tldName)) {
						userDomainNames.push(userDefaultName + rootState.tld.tldName)
					}

					if (!state.selectedName) {
						commit('setSelectedName', userDefaultName + rootState.tld.tldName)
					}
				}

				if (localStorage.getItem(selectedNameKey) && localStorage.getItem(selectedNameKey) !== String(null)) {
					commit('setSelectedName', localStorage.getItem(selectedNameKey))
				} else {
					localStorage.setItem(selectedNameKey, state.selectedName)
				}

				localStorage.setItem(userDomainNamesKey, JSON.stringify(userDomainNames))

				dispatch('fetchSelectedNameData')
			}
		},

		async fetchCanUserBuy({ commit, rootGetters }) {
			const { address } = useVueDapp()

			if (address.value) {
				// fetch if user can buy a domain
				/*
        const minterIntfc = new ethers.utils.Interface(MinterAbi);
        const minterContract = new ethers.Contract(rootGetters["tld/getMinterAddress"], minterIntfc, signer.value);

        const canMint = await minterContract.canUserMint(address.value);
        */

				//commit("setCanUserBuy", canMint);
				commit('setCanUserBuy', true) // minting now open to everyone
			}
		},

		// fetch selectedName data (image etc.)
		async fetchSelectedNameData({ commit, state, rootGetters }) {
			const { signer } = useEthers()

			if (state.selectedName) {
				const nameArr = state.selectedName.split('.')
				const name = nameArr[0]

				if (name) {
					const intfc = new ethers.utils.Interface(rootGetters['punk/getTldAbi'])
					const contract = new ethers.Contract(rootGetters['tld/getTldAddress'], intfc, signer.value)

					const nameData = await contract.domains(name)

					commit('setSelectedNameData', nameData)

					// get contract image for that token ID
					let metadata = await contract.tokenURI(nameData.tokenId)
					let imgFound = false

					if (nameData.data) {
						const customData = JSON.parse(nameData.data)

						if (customData.imgAddress) {
							if (!customData.imgAddress.startsWith('0x')) {
								commit(
									'setSelectedNameImageSvg',
									customData.imgAddress.replace('ipfs://', 'https://ipfs.io/ipfs/'),
								)
								imgFound = true
							} else if (customData.imgAddress) {
								// fetch image URL of that PFP
								const pfpInterface = new ethers.utils.Interface([
									'function tokenURI(uint256 tokenId) public view returns (string memory)',
								])
								const pfpContract = new ethers.Contract(
									customData.imgAddress,
									pfpInterface,
									signer.value,
								)
								metadata = await pfpContract.tokenURI(customData.imgTokenId)
							}
						}

						if (metadata.includes('ipfs://')) {
							metadata = metadata.replace('ipfs://', 'https://ipfs.io/ipfs/')
						}

						if (metadata.includes('http')) {
							const response = await fetch(metadata)
							const result = await response.json()

							if (result && result.image) {
								commit(
									'setSelectedNameImageSvg',
									result.image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
								)
								imgFound = true
							} else {
								commit('setSelectedNameImageSvg', null)
							}
						}
					}

					if (metadata && !imgFound) {
						const json = atob(metadata.substring(29))
						const result = JSON.parse(json)

						if (result && result.image) {
							commit('setSelectedNameImageSvg', result.image)
						} else {
							commit('setSelectedNameImageSvg', null)
						}
					}
				}
			}
		},

		async removeDomainFromUserDomains({ commit, state }, domainName) {
			const { chainId } = useVueDapp()

			if (chainId.value) {
				if (localStorage.getItem(state.userDomainNamesKey)) {
					const userDomainNames = JSON.parse(localStorage.getItem(state.userDomainNamesKey))
					state.userAllDomainNames = []

					let newDomainNamesArray = []
					for (let udName of userDomainNames) {
						if (udName != domainName) {
							newDomainNamesArray.push(udName)
							state.userAllDomainNames.push(udName)
						}
					}

					localStorage.setItem(state.userDomainNamesKey, JSON.stringify(newDomainNamesArray))

					// if the removed domain name is currently marked as selected name, replace it with another or null
					if (
						localStorage.getItem(state.selectedNameKey) &&
						localStorage.getItem(state.selectedNameKey) == domainName
					) {
						if (newDomainNamesArray.length > 0) {
							commit('setSelectedName', newDomainNamesArray[0])
						}
						commit('setSelectedName', null)
					}
				}
			}
		},
	},
}
