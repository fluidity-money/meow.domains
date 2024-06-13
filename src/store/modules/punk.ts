import tldAbi from '../../abi/PunkTLD.json'

export default {
	namespaced: true,

	getters: {
		getTldAbi() {
			return tldAbi
		},
	},
}
