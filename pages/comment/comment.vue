<template>
	<view class="main-container">
		<view class="top">
			<view class="card">
				<view class="text-content">
					<view class="text-top">
						<text>{{data.writing_content}}</text>
					</view>
					<view class="text-bottom">
						<view class="tap">
							<uni-tag :inverted="false" :text="data.writing_tag" type="primary"/>
						</view>
						<view class="writer">
							<text>
								-- {{data.user.user_name}}
							</text>
						</view>
					</view>
				</view>
				<!-- 卡片用户信息 -->
				<view class="text-info">
					<!-- 头像区域 -->
					<view class="text-info-top">
							<image :src="data.user.avatar_url"></image>
					</view>
					<view class="text-info-bottom">
						<view class="card-actions-data" @click="actionsLikeClick(data.id, index)">
							<uni-icons :type="myLike ? 'heart-filled' : 'heart'" size="22" :color="myLike ? 'red' : '#000'"></uni-icons>
							<text class="card-actions-data-text">点赞 {{data.writing_like_count}}</text>
						</view>
						<view class="card-actions-data" @click="actionsCommentClick(data)">
							<uni-icons type="chatbubble" size="22" color="#000"></uni-icons>
							<text class="card-actions-data-text">评论 {{data.writing_comment_count}}</text>
						</view>
					</view>
				</view>
			</view>
			<view class="comment-list" v-for="item in commentList" :key=item.id>
				<view class="comment-top">
					<view class="comment-top_left">
						<view class="image-box">
							<image :src="item.user.avatar_url"></image>
						</view>
						<text>{{item.user.user_name}}</text>
					</view>
					<view class="comment-top_right">
						<text>{{item.createdAt}}</text>
					</view>
				</view>
				<view class="comment-contain">
					<text>{{item.comment}}</text>
				</view>
			</view>
		</view>

		<view class="comment-area">
				<uni-easyinput type="textarea" v-model="value" placeholder="请输入内容"></uni-easyinput>
			<view class="send-btn">
				<button type="primary" @click="sendComment" :disabled="!value || !userInfo.id">发送</button>
			</view>
		</view>
		<!-- 加载更多 -->
		<view class="loadmore" v-if="showLoadMore">
			<text>{{loadMoreText}}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				id: null,
				userInfo: {},
				data: {},
				myLike: false,
				value: '',
				commentList: [],
				commentPage: 0,
				showLoadMore: false,
				loadMoreText: '加载中...'
			}
		},
		onLoad(option) {
			this.id = option.id
			this.userInfo.id = option.userId
			if(this.userInfo.id = 'undefined') {
				try{
					this.userInfo = uni.getStorageSync('userInfo') ? uni.getStorageSync('userInfo') : {}
				}catch(e){
					// console.log(e)
					return null
				}
			}
			this.getData()
			 //获取事件对象
				// const eventChannel = this.getOpenerEventChannel()
				//通知上一页，传回参数，响应函数
				//改变上一页监听的数据时调用
				// eventChannel.emit('getNewData', {data: 'test'});
				// eventChannel.emit('someEvent', {data: 'test'});
				// console.log(option)
		},
		onUnload() {
			const eventChannel = this.getOpenerEventChannel()
			eventChannel.emit('getNewData', {
				likeCount: this.data.writing_like_count,
				commentCount: this.data.writing_comment_count,
				likeState: this.myLike
				});
			this.commentPage = 0,
			this.data = null,
			this.loadMoreText = "加载中...",
			this.showLoadMore = false;
			// eventChannel = null
		},
		onReachBottom() {
			this.loadMore()
		},
		methods: {
			async getMyLike() {
				const { data } = await this.$myRequest({
					url: `/like/getLikeById?userId=${this.userInfo.id}&writingId=${this.id}`,
				})
				this.myLike = data.data
			},
			async getData() {
				if(this.userInfo.id) {
					this.getMyLike()
				}
				const { data } = await this.$myRequest({
					url: `/writing/byId?id=${this.id}`
				})
				this.data = data.data
				this.commentList = data.data.comments
			},
			// 点赞
			async actionsLikeClick() {
				if(this.userInfo.id) {
					this.myLike = !this.myLike
					this.data.writing_like_count += this.myLike ? 1 : -1
					const { data } = await this.$myRequest({
						url: '/like',
						method: 'POST',
						data: {
							condition: this.myLike ? 1 : 0,
							user_id: this.userInfo.id,
							writing_id: this.id,
							writer: this.data.user_id,
							writing_like_count: this.data.writing_like_count
						}
					})
				} else {
					uni.showToast({
						title: '请登录后再操作',
						icon: 'error'
					})
				}

			},
			// 发表评论
			async sendComment() {
				if(this.value) {
					const { data } = await this.$myRequest({
						url: '/comment',
						method: 'POST',
						data: {
							user_id: this.userInfo.id,
							writing_id: this.data.id,
							writer: this.data.user.id,
							comment: this.value
						}
					})
					this.userInfo.myCommentNum++
					uni.setStorageSync('userInfo', this.userInfo);
					uni.$emit('updateUserInfo', this.userInfo)
					uni.showToast({
						title: '发言成功',
						icon:'success'
					})
					this.value = null
					this.getData()
				} else {
					uni.showToast({
						title: '请输入内容',
						icon:'none'
					})
				}
			},
			// 评论列表
			async getCommentList() {
				const { data } = await this.$myRequest({
					url: `/comment?writingId=${this.data.id}&page=${this.commentPage}`
				})
				this.commentList = data.data
			},
			// 加载更多评论
			async loadMore() {
				this.commentPage++
				this.showLoadMore = true;
				const { data } = await this.$myRequest({
					url: `/comment?page=${this.commentPage}&writingId=${this.data.id}`
				})
				if (data.data.length === 0) {
					this.loadMoreText = "暂时还没发现更多评论!"
					return;
				}
				this.commentList = this.commentList.concat(data.data)
				// this.myLike = this.myLike.concat(myLike)
			},
		}
	}
</script>

<style lang="scss">
	page {
		background-color: #E8E8E8;
		height: 100%;
	}
	.card {
		font-weight: 700;
		border-radius: 20px;
		margin: 15px 15px;
		background-color: #FFFFFF;
		// padding: 20px;
		display: flex;

		.text-content {
			flex: 9;
			margin: 20px 10px 20px 20px;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			.text-top {
				margin-bottom: 40px;

				text {
					font-size: 18px;
					color: #7B7B7B;
					word-break: break-all;
				}
			}

			.text-bottom {
				display: flex;
				flex-direction: row;
				flex-wrap: nowrap;
				justify-content: space-between;
				.uni-tag {
					background-color: #CFF0FE;
					border: none;
					color: #027AFF;
					font-weight: 700;
					// font-size: 12px;
				}
				text {
					color: #7B7B7B;
				}
			}
		}
		.text-info {
			margin: 20px 8px 20px 10px;
			flex: 4;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			align-items: center;
			border-left: solid 2px #EDEDED;
			
			.text-info-top {
				width: 50px;
				height: 50px;
				border-radius: 25px;
				overflow: hidden;
				margin-bottom: 25px;
				
				image {
					width: 100%;
					height: 100%;
				}
			}

			.text-info-bottom {
				font-size: 10px;
				.card-actions-item {
					margin-top: 10px;

					// text {
					// 	font-size: 10px;
					// }
				}
			}
		}
	}
	
	.uni-easyinput {
		background-color: #fff;
	}
	
	.main-container {
		height: 100%;
	}
	
	.comment-area {
		width: 100%;
		position: fixed;
		bottom: 0;
	}
	
	// .comment-list:last-child {
	// 	margin-bottom: 160px;
	// }
	.comment-list {
		margin: 10px 20px;
		.comment-top {
			display: flex;
			justify-content: space-between;
			margin: 15px 0;
			.comment-top_left {
				display: flex;
				align-items: center;
				text {
					font-size: 10px;
					color: #999999;
					margin-left: 8px;
				}
				.image-box{
					width: 24px;
					height: 24px;
					border-radius: 12px;
					overflow: hidden;
					// margin-bottom: 12px;

					image {
						width: 100%;
						height: 100%;
					}
				}
			}
			.comment-top_right text{
				font-size: 10px;
				color: #999999;
			}			
		}
		.comment-contain {
			text {
				font-size: 14px;
			}
		}
	}
	.loadmore {
		text-align: center;
		margin-top: 20px;
		margin-bottom: 140px;
			text{
				font-size: 12px;
				font-weight: 700;
			}
		}
</style>
