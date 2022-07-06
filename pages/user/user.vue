<template>
	<view>
		<view class="user_header_content">
			<view class="user_header_top" @click="getUserName">
				<view class="user_name">
					<text>{{userInfo.user_name ? userInfo.user_name : '微信用户'}}</text>
				</view>
				<text class="getusernametext" :style="'display: ' + getUserNameDisplay">点击同步用户信息</text>
				<view class="user_portrait">
					<image :src="userInfo.avatar_url" mode=""></image>
				</view>
			</view>
			<view class="user_header_buttom">
				<view class="box" @click="toMyWritingPage">
					<view class="box_top">
						<text>{{userInfo.myPublishNum}}</text>
					</view>
					<view class="box_bottom">
						<text>我的投稿</text>
					</view>
				</view>
				<view class="box" @click="toMyCommentPage">
					<view class="box_top">
						<text>{{userInfo.myCommentNum}}</text>
					</view>
					<view class="box_bottom">
						<text>我的评论</text>
					</view>
				</view>
				<view class="box">
					<view class="box_top">
						<text>{{userInfo.receiveLikeNum}}</text>
					</view>
					<view class="box_bottom">
						<text>收到点赞</text>
					</view>
				</view>
				<view class="box">
					<view class="box_top">
						<text>{{userInfo.receiveCommentNum}}</text>
					</view>
					<view class="box_bottom">
						<text>收到评论</text>
					</view>
				</view>
			</view>

		</view>
		<!-- 中间黑条 -->
		<view class="centre_box"></view>
		<!-- 列表 -->
		<view class="user_body_content">
			<view class="list" @click="toMyLikesPage()">
				<view class="list_header">
					<text>我的点赞</text>
				</view>
				<view class="list_trail">
					<uni-icons type="forward" size="18" color="#C9C9C9"></uni-icons>
				</view>
			</view>
			<view class="list" @click="toAboutPage">
				<view class="list_header">
					<text>关于</text>
				</view>
				<view class="list_trail">
					<uni-icons type="forward" size="18" color="#C9C9C9"></uni-icons>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {},
				loginDisplay: 'block',
				getUserNameDisplay: 'block'
			};
		},
		onLoad() {
			this.getUserInfo()
			uni.$on('updateUserInfo', data => {
				this.userInfo = data
			})
		},
		onShow() {
		},
		onPullDownRefresh() {
			this.updataUserInfo()
			uni.stopPullDownRefresh();
		},
		methods: {
			async updataUserInfo() {
				const { data } = await this.$myRequest({
					url: `/userbyid?id=${this.userInfo.id}`
				})
				this.userInfo = data.data
			},
			getUserInfo() {
				try{
					this.userInfo = uni.getStorageSync('userInfo') ? uni.getStorageSync('userInfo') : {}
				}catch(e){
					uni.showToast({
						title: '登录失败,请重新登录',
						icon: 'error'
					})
				}
			},
			getUserName() {
				if(uni.getUserProfile) {
					uni.getUserProfile({
						desc: '获取用户名',
						success: async (info) => {
							this.userInfo.user_name = info.userInfo.nickName
							this.userInfo.avatar_url = info.userInfo.avatarUrl
							this.userInfo.gender = info.userInfo.gender
							try {
								uni.setStorageSync('userInfo', this.userInfo);
							} catch (e) {
								uni.showToast({
									title: '登录失败',
									icon: 'error'
								})
							}
							uni.$emit('updateUserInfo', this.userInfo)
							this.getUserNameDisplay = this.userInfo.user_name === '微信用户' ? 'block' : 'none'
							const { data } = await this.$myRequest({
								url: '/updateUser',
								method: 'POST',
								data: this.userInfo
							})
							uni.showToast({
								title: '更新成功',
								icon: 'success'
							})
						}
					})
				}
			},
			toMyWritingPage() {
				uni.navigateTo({
					url: `/pages/myManuscriptPage/myManuscriptPage?userId=${this.userInfo.id}`,
					events: {
						// 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
						// 被打开页面进行回调
						getNewData: data => {
							this.writingData[index].writing_like_count = data.likeCount,
							this.writingData[index].writing_comment_count = data.commentCount,
							this.myLike[index] = data.likeState
						}
					},
					success: () => {
					},
					fail: () => {
					}
				})
			},
			// 跳转我的评论页
			toMyCommentPage() {
				uni.navigateTo({
					url: `/pages/myComment/myComment?userId=${this.userInfo.id}`,
					success: () => {
					},
					fail: (e) => {
						return null
					}
				})
			},
			toMyLikesPage() {
				uni.navigateTo({
					url: `/pages/myLikesPage/myLikesPage?userId=${this.userInfo.id}`
				})
			},
			toAboutPage() {
				uni.navigateTo({
					url: '/pages/about/about'
				})
			}
		}
	}
</script>

<style lang="less">
	// 用户信息区
	.user_header_content {
		padding: 30px;
		margin: 20px 0 0 0;
		// 用户信息头部
		.user_header_top {
			display: flex;
			flex-wrap: nowrap;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 100rpx;
			// 用户名样式
			.user_name {
				text {
					font-size: 24px;
					font-weight: 700;
				}
			}
			// 头像
			.user_portrait {
				width: 120rpx;
				height: 120rpx;
				// background-color: red;
				border-radius: 60rpx;
				overflow: hidden;
				image {
					width: 100%;
					height: 100%;
				}
			}
		}
		
		.user_header_buttom {
			display: flex;
			flex-wrap: nowrap;
			justify-content: space-between;

			.box {
				display: flex;
				flex-direction: column;
				align-items: center;
				
				.box_top text{
					font-size: 14px;
					font-weight: 700;
				}
				.box_bottom text{
					font-size: 10px;
					font-weight: 500;
					color: #A7A7A7;
				}
			}
		}
	}
	.centre_box {
		background-color: #F3F3F3;
		height: 10px;
	}
	.user_body_content {
		padding: 0px 20px;
		
		.list {
			height: 60px;
			border-bottom: solid 2px #F3F3F3;
			display: flex;
			justify-content: space-between;
			text{
				line-height: 60px;
				font-size: 15px;
				font-weight: 700;
			}
		}
	}
	// 请求获取用户名提示
	.getusernametext {
		font-size: 10px;
		color: #A7A7A7;
	}

</style>
