export default function useDomainHelpers() {
	function buyNotValid(domainName: string) {
		if (domainName === '') {
			return { invalid: true, message: null }
		} else if (domainName === null) {
			return { invalid: true, message: null }
		} else if (domainName.includes('.')) {
			return { invalid: true, message: 'Dots not allowed' }
		} else if (domainName.includes(' ')) {
			return { invalid: true, message: 'Spaces not allowed' }
		} else if (domainName.includes('%')) {
			return { invalid: true, message: '% not allowed' }
		} else if (domainName.includes('&')) {
			return { invalid: true, message: '& not allowed' }
		} else if (domainName.includes('?')) {
			return { invalid: true, message: '? not allowed' }
		} else if (domainName.includes('#')) {
			return { invalid: true, message: '# not allowed' }
		} else if (domainName.includes('/')) {
			return { invalid: true, message: '/ not allowed' }
		} else if (domainName.includes(',')) {
			return { invalid: true, message: 'Comma not allowed' }
		} else if (
			domainName.includes('\\') ||
			domainName.includes('­') ||
			domainName.includes('	') ||
			domainName.includes('͏') ||
			domainName.includes('؜') ||
			domainName.includes('܏') ||
			domainName.includes('ᅟ') ||
			domainName.includes('ᅠ') ||
			domainName.includes(' ') ||
			domainName.includes('឴') ||
			domainName.includes('឵') ||
			domainName.includes('᠎') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes('​') ||
			domainName.includes('‌') ||
			domainName.includes('‍') ||
			domainName.includes('‎') ||
			domainName.includes('‏') ||
			domainName.includes(' ') ||
			domainName.includes(' ') ||
			domainName.includes('⁠') ||
			domainName.includes('⁡') ||
			domainName.includes('⁢') ||
			domainName.includes('⁣') ||
			domainName.includes('⁤') ||
			domainName.includes('⁪') ||
			domainName.includes('⁫') ||
			domainName.includes('⁬') ||
			domainName.includes('⁭') ||
			domainName.includes('⁮') ||
			domainName.includes('⁯') ||
			domainName.includes('　') ||
			domainName.includes('⠀') ||
			domainName.includes('ㅤ') ||
			domainName.includes('ﾠ') ||
			domainName.includes('𑂱') ||
			domainName.includes('𛲠') ||
			domainName.includes('𛲡') ||
			domainName.includes('𛲢') ||
			domainName.includes('𛲣') ||
			domainName.includes('𝅙') ||
			domainName.includes('𝅳') ||
			domainName.includes('𝅴') ||
			domainName.includes('𝅵') ||
			domainName.includes('𝅶') ||
			domainName.includes('𝅷') ||
			domainName.includes('𝅸') ||
			domainName.includes('𝅹') ||
			domainName.includes('𝅺') ||
			domainName.includes('') ||
			domainName.includes('') ||
			domainName.includes('')
		) {
			return { invalid: true, message: 'This character is not allowed' }
		}

		return false
	}

	// RETURN
	return {
		buyNotValid,
	}
}
