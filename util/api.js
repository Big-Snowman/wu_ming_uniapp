const BASE_URL = ''
export const myRequest = (option) => {
	return new Promise((resolve, reject) => {
		uni.request({
			header: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			url: BASE_URL + option.url,
			method: option.method || 'GET',
			data: option.data || {},
			success: (res) => {
				if(res.data.status !== 200 && res.data.status !== 201) {
					return uni.showToast({
						icon: 'error',
						title: '连接服务器失败',
					})
				}
				resolve(res)
			},
			fail: (err) => {
				uni.showToast({
					icon: 'error',
					title: '请求接口失败'
				})
				reject(err)
			}
		})
	})
}