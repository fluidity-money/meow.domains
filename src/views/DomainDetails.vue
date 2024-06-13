<template>
	<div class="row">
		<div class="col-md-3" id="sidebar-container">
			<Sidebar />
		</div>

		<div class="col-md-9">
			<div class="row">
				<div class="col-md-12">
					<div class="container text-center">
						<h3>{{ domainName }}.{{ tld }}</h3>

						<img class="img-thumbnail domain-image" :src="pfpImage" />

						<div class="mb-3 text-center mt-4" v-if="loadingData">
							<span class="spinner-border spinner-border-lg" role="status" aria-hidden="true"></span>
						</div>

						<div class="mb-3 row domain-data mt-4" v-if="domainData">
							<div class="col-sm-3 punk-title">Holder address</div>

							<div class="col-sm-9 punk-text text-break">
								{{ holderData }}
								<a :href="getBlockExplorerBaseUrl + '/address/' + holderData" target="_blank">
									<i class="bi bi-box-arrow-up-right"></i>
								</a>
							</div>
						</div>

						<div class="mb-3 row domain-data mt-4">
							<div class="col-sm-3 punk-title">Network</div>

							<div class="col-sm-9 punk-text text-break">
								{{ getChainName(Number(domainChain)) }}
							</div>
						</div>

						<!--
            <EditUrl 
              :domainData="domainData" 
              :tld="tld" 
              :domainName="domainName" 
              @fetchData="fetchData" 
            />

            <EditPfp
              :domainData="domainData" 
              :tld="tld" 
              :domainName="domainName" 
              @fetchData="fetchData"  
            />
            -->

						<EditOtherData
							:domainData="domainData"
							:tld="tld"
							:domainName="domainName"
							:isCorrectChainForDomain="isCorrectChainForDomain"
							@fetchData="fetchData"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ethers } from 'ethers'
import { mapGetters } from 'vuex'
import { useEthers } from '../pinia-stores/ethers'
import { useToast, TYPE } from 'vue-toastification'
import tldsJson from '../abi/tlds.json'
import tldAbi from '../abi/PunkTLD.json'
import EditOtherData from '../components/domainEdit/EditOtherData.vue'
import EditPfp from '../components/domainEdit/EditPfp.vue'
import EditUrl from '../components/domainEdit/EditUrl.vue'
import Sidebar from '../components/Sidebar.vue'
import WaitingToast from '../components/toasts/WaitingToast.vue'
import useChainHelpers from '../hooks/useChainHelpers'
import { storeToRefs } from 'pinia'

export default {
	name: 'DomainDetails',
	props: ['domainChain', 'tld', 'domainName'],
	components: {
		EditOtherData,
		EditPfp,
		EditUrl,
		Sidebar,
	},

	data() {
		return {
			loadingData: false,
			tldContract: null,
			domainData: null,
			pfpImage: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg',
		}
	},

	created() {
		// fetch existing data from blockchain
		if (!this.tldContract && this.isCorrectChainForDomain) {
			this.setContract()
		}

		this.fetchData()
	},

	computed: {
		...mapGetters('punk', ['getTldAbi']),
		...mapGetters('tld', ['getTldAddress']),
		...mapGetters('network', [
			'getBlockExplorerBaseUrl',
			'getChainId',
			'getSupportedNetworks',
			'isNetworkSupported',
		]),

		holderData() {
			if (this.domainData.holder !== ethers.constants.AddressZero) {
				return this.domainData.holder
			}

			return 'This domain name is not owned by anyone yet.'
		},

		isCorrectChainForDomain() {
			if (Number(this.domainChain) === Number(this.getChainId)) {
				return true
			}

			return false
		},
	},

	methods: {
		async fetchData() {
			this.loadingData = true

			// get fallback provider based on network ID
			const fProvider = this.getFallbackProvider(Number(this.domainChain))

			// create TLD contract
			const intfc = new ethers.utils.Interface(tldAbi)
			const tldContractRead = new ethers.Contract(tldsJson[this.domainChain]['.' + this.tld], intfc, fProvider)

			if (tldContractRead) {
				// get domain data
				this.domainData = await tldContractRead.domains(this.domainName)

				if (this.domainData && this.domainData.holder !== ethers.constants.AddressZero) {
					let metadata = await tldContractRead.tokenURI(this.domainData.tokenId)
					let noImg = true

					if (this.domainData.data) {
						const customData = JSON.parse(this.domainData.data)

						if (customData.imgAddress) {
							if (!customData.imgAddress.startsWith('0x')) {
								this.pfpImage = customData.imgAddress.replace('ipfs://', 'https://ipfs.io/ipfs/')
								noImg = false
							} else if (customData.imgAddress) {
								// fetch image URL of that PFP
								const pfpInterface = new ethers.utils.Interface([
									'function tokenURI(uint256 tokenId) public view returns (string memory)',
								])

								const pfpContract = new ethers.Contract(customData.imgAddress, pfpInterface, fProvider)
								metadata = await pfpContract.tokenURI(customData.imgTokenId)
							} else {
								// get contract image for that token ID
								metadata = await tldContractRead.tokenURI(customData.imgTokenId)
							}
						}

						if (metadata.includes('ipfs://')) {
							metadata = metadata.replace('ipfs://', 'https://ipfs.io/ipfs/')
						}

						if (metadata.includes('http')) {
							const response = await fetch(metadata)
							const result = await response.json()

							if (result && result.image) {
								this.pfpImage = result.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
								noImg = false
							}
						}
					}

					if (metadata && noImg) {
						const json = atob(metadata.substring(29))
						const result = JSON.parse(json)

						if (result && result.image) {
							this.pfpImage = result.image
						}
					}
				}
			}

			this.loadingData = false
		},

		setContract() {
			// construct contract
			const intfc = new ethers.utils.Interface(this.getTldAbi)
			this.tldContract = new ethers.Contract(this.getTldAddress, intfc, this.signer)
		},
	},

	setup() {
		const { isConnected, signer } = useEthers()
		const toast = useToast()
		const { getChainName, getFallbackProvider } = useChainHelpers()

		return { getChainName, getFallbackProvider, isConnected, signer, toast }
	},
}
</script>

<style scoped>
.domain-image {
	max-width: 200px;
}

.punk-text {
	text-align: left;
}

@media only screen and (max-width: 767px) {
	.punk-text {
		text-align: center;
	}

	.punk-title {
		font-size: 1.1em;
		margin-bottom: 5px;
		font-weight: bold;
	}
}
</style>
