<template>
	<view>
		<!-- 回到顶部 -->
		<view class="toTop">
			<uni-icons type="arrow-up" size="35" @click="toTop" :style="'display:' + (flag ? 'block' : 'none')"></uni-icons>
		</view>
		<!-- 评论列表 -->
		<view class="comment-list-box" v-for="(item, index) in myCommentList" :key="item.id">
			<view class="comment-list-head">
				<view class="comment-list-head-left">
					<image :src="userInfo.avatar_url"></image>
					<text>{{userInfo.user_name}}</text>
				</view>
				<view class="comment-list-hrad-right">
					<text>{{item.createdAt}}</text>
					<uni-icons type="trash" size="14" @click="removeComment(item, index)"></uni-icons>
				</view>
			</view>
			<view class="comment-list-contain">
				<text>{{item.comment}}</text>
			</view>
			<view class="comment-list-bottom" @click="toCommentPage(item)">
				查看原文
			</view>
		</view>
		<!-- 加载更多 -->
		<view class="loadmore" v-if="showLoadMore" style="text-align: center;margin-bottom: 5px;">
			<text style="font-size: 12px;font-weight: 700;">{{loadMoreText}}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {},
				myCommentList: [],
				page: 0,
				showLoadMore: false,
				loadMoreText: "加载中...",
				// 回到顶部显示开关
				flag: false
			};
		},
		onLoad(option) {
			this.userInfo.id = option.userId
			this.getMyComment()
		},
		onUnload() {
			uni.setStorageSync('userInfo', this.userInfo)
			uni.$emit('updateUserInfo', this.userInfo)
			this.updateUserComment()
			this.loadMoreText = "加载中..."
			this.showLoadMore = false
			this.page = 0
			this.myCommentList = []
		},
		// 触底触发
		onReachBottom() {
			this.loadMore()
		},
		methods: {
			async getMyComment() {
				try{
					this.userInfo = uni.getStorageSync('userInfo') ? uni.getStorageSync('userInfo') : this.userInfo
				} catch(e){
					return null
				}
				const { data } = await this.$myRequest({
					url: `/comment/getCommentByUserId?page=0&userId=${this.userInfo.id}`
				})
				this.myCommentList = data.data.rows
				this.userInfo.myCommentNum = data.data.count
			},
			// 查看原文
			toCommentPage(item) {
				uni.navigateTo({
					url: `/pages/comment/comment?id=${item.writing_id}&userId=${this.userInfo.id}`
				})
			},
			// 删除评论事件
			removeComment(item, index) {
				const that = this
				uni.showModal({
					title: '删除评论',
					content: '确定要删除这条评论吗',
					success: async function (res) {
						if (res.confirm) {
							const { data } = await that.$myRequest({
								url: `/comment/${item.id}/${item.writing_id}`,
								method: 'DELETE',
							})
							that.myCommentList.splice(index,1)
							that.userInfo.myCommentNum--
							uni.showToast({
								title: '删除评论成功',
								icon: 'success'
							})
							// 页面通讯更新用户信息
							uni.$emit('updateUserInfo', that.userInfo)
						} else if (res.cancel) {
							return
						}
					}
				});
			},
			// 更新用户评论数
			async updateUserComment() {
				await this.$myRequest({
					url: '/updateUserComment',
					method: 'POST',
					data: {
						id: this.userInfo.id,
						myCommentNum: this.userInfo.myCommentNum
					}
				})
			},
			// 加载更多
			async loadMore() {
				this.showLoadMore = true;
				this.page++
				const { data } = await this.$myRequest({
					url: `/comment/getCommentByUserId?page=${this.page}&userId=${this.userInfo.id}`
				})
				if (data.data.rows.length === 0) {
					this.loadMoreText = "我可是有底线的!"
					return;
				}
				this.myCommentList = this.myCommentList.concat(data.data.rows)
			}
		}
	}
</script>

<style lang="scss">
	page {
		background-color: #E8E8E8;
		height: 100%;
	}
	.comment-list-box {
		background-color: #fff;
		padding: 5px;
		margin: 2px 10px;
		// 列表卡片头部
		.comment-list-head {
			display: flex;
			justify-content: space-between;
			// 头像区域
			.comment-list-head-left {
				image {
					width: 20px;
					height: 20px;
					border-radius: 10px;
					overflow: hidden;
					vertical-align: middle;
					margin: 0 5px;
				}
				text {
					font-size: 10px;
					line-height: 30px;
					color: #7B7B7B;
				}
			}
			// 时间及删除区域
			.comment-list-hrad-right {
				text {
					font-size: 10px;
					color: #7B7B7B;
					margin: 10px 1px 8px 5px;
				}
			}
		}
		// 评论内容
		.comment-list-contain {
			margin: 3px 5px 5px 5px;
		}
		// 查看原文
		.comment-list-bottom {
			font-size: 9px;
			color: #7B7B7B;
			border: solid #7B7B7B 1px;
			border-radius: 8px;
			display: inline-block;
			margin: 1px 5px 2px 5px;
			padding: 1px 2px;
		}
		// 加载更多样式
		.loadmore {
			text-align: center;
			margin-bottom: 5px;
				text{
					font-size: 12px;
					font-weight: 700;
				}
			}
	}
</style>
