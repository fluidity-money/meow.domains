import { createStore } from 'vuex'
import network from './modules/network'
import user from './modules/user'
import punk from './modules/punk'
import tld from './modules/tld'

const store = createStore({
	modules: {
		network,
		user,
		punk,
		tld,
	},
})

export default store
