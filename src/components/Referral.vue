<template>
	<div class="row">
		<div class="col-md-12 mt-3">
			<div class="container text-center">
				<h3>Referrals</h3>

				<p>Share this referral link and earn a {{ getReferralFee / 100 }}% referral fee from new mints!</p>

				<div class="row mt-1">
					<div class="col-md-6 offset-md-3">
						<input
							class="form-control text-center clipboard"
							:value="getReferralUrl"
							@click="copyToClipboard(getReferralUrl)"
							readonly
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex'
import { useToast, TYPE } from 'vue-toastification'

export default {
	name: 'Referral',

	computed: {
		...mapGetters('user', ['getUserAddress', 'getUserSelectedName']),
		...mapGetters('tld', ['getReferralFee']),

		getReferralUrl() {
			let nameOrAddress

			if (this.getUserSelectedName) {
				nameOrAddress = this.getUserSelectedName
			} else {
				nameOrAddress = this.getUserAddress
			}

			return window.location.origin + '/?ref=' + nameOrAddress
		},
	},

	methods: {
		copyToClipboard(text) {
			navigator.clipboard.writeText(text)
			this.toast('Referral link copied to your clipboard!', {
				type: TYPE.SUCCESS,
			})
		},
	},

	setup() {
		const toast = useToast()

		return { toast }
	},
}
</script>

<style scoped>
.clipboard {
	cursor: pointer;
	color: #0d0f1a;
}
</style>
