<template>
	<view class="main-page">
		<view class="main-area">
			<view class="writing-textarea">
				<uni-easyinput confirmType="send" :inputBorder="false" type="textarea" v-model="value" placeholderStyle="color: #7B7B7B" clearSize="18" placeholder="冲冲冲~"></uni-easyinput>
			</view>
			<view class="send-btn">
				<button type="primary" @click="sendWriting" :disabled="!value">发表</button>
			</view>
		</view>
		<view>
			<!-- 发表按钮 -->
			<!-- <view class="addtag">
				<text>
					添加标签
				</text>
					<uni-icons type="compose" size="35" @click="toWritingPage"></uni-icons>
			</view> -->
			<!-- 输入框示例 -->
			<!-- <uni-popup ref="inputDialog" type="dialog">
				<uni-popup-dialog ref="inputClose"  mode="input" title="输入内容" value="对话框预置提示内容!"
					placeholder="请输入内容" @confirm="dialogInputConfirm"></uni-popup-dialog>
			</uni-popup> -->
		</view>
	</view>

</template>

<script>
	export default {
		data() {
			return {
				value: '',
				userInfo: {}
			}
		},
		onLoad() {
			this.getUserInfo()
		},
		methods: {
			getUserInfo() {
				try {
					this.userInfo = uni.getStorageSync('userInfo')
				} catch (e) {
					uni.showToast({
						title: '获取用户登录信息失败，请重新登录',
						icon: 'error'
					})
				}
			},
			inputDialogToggle() {
				this.$refs.inputDialog.open()
			},
			async sendWriting() {
				if (this.value === '') {
					uni.showToast({
						title: '内容不能为空',
						icon: 'none'
					})
				} else if (this.value.length < 5) {
					uni.showToast({
						title: '内容过短',
						icon: 'none'
					})
				} else {
					const { data } = await this.$myRequest({
						url: '/writing',
						method: 'POST',
						data: {
							userId: this.userInfo.id,
							writingTag: 'demo',
							writingContent: this.value
						}
					})
					uni.showToast({
						title: '发表成功',
						icon: 'none'
					})
					uni.reLaunch({
						url: "/pages/index/index"
					});
				}
			}
		}
	}
</script>

<style lang="scss">
	page {
		font-size: 18px;
		background-color: #E8E8E8;
		height: 100%;
		.main-area {
			display: flex;
			flex-direction: column;
			height: 100%;
			justify-content: space-between;
		}
		.main-page {
			width: 100%;
			height: 100%;
		}
	}
	.writing-textarea {
		padding: 20px 15px;
	}
	
	.uni-easyinput {
		background-color: #fff;
		border-radius: 10px;
		height: 350rpx;
		.uni-easyinput__content-textarea {
			padding: 10px;
		}
		.uni-textarea-wrapper {
			font-size: 16px;
		}
	}
	
	.addtag {
		position: fixed;
		right: 30px;
		bottom: 300px;
	}
</style>
