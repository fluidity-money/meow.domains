<template>
	<div class="row">
		<div class="col-md-12">
			<div class="container">
				<h3>My TLDs</h3>

				<table class="table table-hover mt-4 mb-4">
					<tbody>
						<tr v-for="tld in ownedTlds">
							<td>
								<span
									class="text-white text-click"
									@click="
										this.$router.push({
											name: 'TldDetails',
											params: {
												domainChain: getChainId,
												tld: tld.substring(1),
											},
										})
									"
								>
									{{ tld }}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
import { ethers } from 'ethers'
import { useEthers } from '../pinia-stores/ethers'
import { mapGetters } from 'vuex'
import { storeToRefs } from 'pinia'

export default {
	name: 'MyTlds',

	data() {
		return {
			ownedTlds: null,
		}
	},

	created() {
		this.checkTldOwnership()
	},

	computed: {
		...mapGetters('network', ['getChainId']),
		...mapGetters('punk', ['getTlds', 'getTldAbi']),
		...mapGetters('tld', ['getTldAddress']),
	},

	methods: {
		async checkTldOwnership() {
			this.ownedTlds = []

			if (this.getTlds) {
				for (let tld of this.getTlds) {
					// construct contract
					const intfc = new ethers.utils.Interface(this.getTldAbi)
					const tldContract = new ethers.Contract(this.getTldAddress, intfc, this.signer)

					const tldOwner = await tldContract.owner()

					if (String(tldOwner).toLowerCase() === String(this.address).toLowerCase()) {
						this.ownedTlds.push(tld)
					}
				}
			}
		},
	},

	setup() {
		const { address, isConnected, signer } = useEthers()

		return { address, isConnected, signer }
	},
}
</script>

<style scoped>
.text-click:hover {
	color: white;
	text-decoration: underline;
	cursor: pointer;
}
</style>
