<template>
	<div class="text-center">
		<div class="text-primary-600 text-9xl font-bold my-5">404</div>
		<div class="text-2xl text-gray-500 my-5">Oops. Page not found...</div>

		<!--
    <p class="punchline">
      Domains for DAOs
    </p>
    -->

		<p class="logo">Punk Domains</p>

		<div class="flex flex-row justify-center space-x-4">
			<button @click="this.$router.go(-1)" class="btn btn-primary my-5 mx-2">Back</button>
			<button @click="this.$router.push({ name: 'Home' })" class="btn btn-primary my-5">Home</button>
		</div>
	</div>
</template>

<style scoped>
.punchline {
	font-size: 4em;
	margin-top: 150px;
	margin-bottom: 50px;
}

.logo {
	font-family: Arial, cursive;
	font-size: 2em;
	/*margin-bottom: 150px;*/
}
</style>
