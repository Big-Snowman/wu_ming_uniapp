<template>
	<view>
		<!-- 回到顶部 -->
		<view class="toTop">
			<uni-icons type="arrow-up" size="35" @click="toTop" :style="'display:' + (flag ? 'block' : 'none')"></uni-icons>
		</view>
		
		<!-- 卡片区域 -->
		<view class="card" v-for="(item, index) in writingData" :key=item.id>
			<view class="text-content" @click="actionsCommentClick(item, index)">
				<view class="text-top">
					<text>{{item.writing_content}}</text>
				</view>
				<view class="text-bottom">
					<view class="tap">
						<uni-tag :inverted="false" :text="item.writing_tag" type="primary"/>
					</view>
					<view class="writer">
						<text>
							-- {{item.user.user_name}}
						</text>
					</view>
				</view>
			</view>
			<!-- 卡片用户信息 -->
			<view class="text-info">
				<!-- 头像区域 -->
				<view class="text-info-top">
						<image :src="item.user.avatar_url"></image>
				</view>
				<view class="text-info-bottom">
					<view class="card-actions-item" @click="actionsLikeClick(item, index)">
						<uni-icons :type="myLike[index] ? 'heart-filled' : 'heart'" size="22" :color="myLike[index] ? 'red' : '#000'"></uni-icons>
						<text class="card-actions-item-text">点赞 {{item.writing_like_count}}</text>
					</view>
					<view class="card-actions-item" @click="actionsCommentClick(item, index)">
						<uni-icons type="chatbubble" size="22" color="#000"></uni-icons>
						<text class="card-actions-item-text">评论 {{item.writing_comment_count}}</text>
					</view>
				</view>
			</view>
		</view>
		<view class="loadmore" v-if="showLoadMore">
			<text>{{loadMoreText}}</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				nowPage: 1,
				showLoadMore: false,
				loadMoreText: "加载中...",
				writingData: [],
				eventChannel: null,
				// 所有点赞过的id
				myAllLike: [],
				myLike: [],
				// 要加载的点赞id列表
				idList: [],
				idStr: '',
				userInfo: {},
				// 回到顶部显示开关
				flag: false,
				// 更改的点赞状态列表
				changeLikeList: []
			}
		},
		onLoad() {
			this.getWriting()
			// 更新其他页面缓存的点赞状态
			uni.$on('updataChangeLikeList', data => {
				this.changeLikeList = data
				for (let i = 0; i < this.changeLikeList.length; i++) {
					for (let j = 0; j < this.writingData.length; j++) {
						if( this.writingData[j].id === this.changeLikeList[i].writingId) {
							this.writingData[j].writing_like_count = this.changeLikeList[i].writing_like_count
							this.myLike[j] = this.changeLikeList[i].likeStatus
						}
					}
				}
			})
		},
		onUnload() {
			this.page = 0
			this.writingData = []
			this.loadMoreText = "加载中..."
			this.showLoadMore = false
			uni.$emit('updataChangeLikeList', this.changeLikeList)
		},
		onPullDownRefresh() {
			this.page = 0
			this.getWriting()
			uni.stopPullDownRefresh()
		},
		onReachBottom() {
			this.loadMore()
		},
		onShow() {
		},
		methods: {
			async getUserInfo() {
				try{
					this.userInfo = uni.getStorageSync('userInfo') ? uni.getStorageSync('userInfo') : this.userInfo
				}catch(e){
					return null
				}
				const { data } = await this.$myRequest({
					url: `/like?userId=${this.userInfo.id}`
				})
				this.myAllLike = data.data.map((item) => {
					return item.writing_id
				})
				if(this.myAllLike.length >= 10) {
					this.idList = this.myAllLike.splice(0, 10)
				} else {
					this.idList = this.myAllLike
				}
				this.idStr = this.idList.join()
			},
			async getWriting() {
				await this.getUserInfo()
				const { data } = await this.$myRequest({
					url: `/writing/getUserLikeWriting?id=${this.idStr}`
				})
				this.writingData = data.data
				this.myLike = data.data.map((item, index) => {
					return true
				})
			},
			// 加载更多
			async loadMore() {
				this.showLoadMore = true;
				this.nowPage++
				if(this.myAllLike.length >= 10) {
					this.idList = this.myAllLike.splice(0, 10)
				} else if (this.myAllLike.length < 10 && this.myAllLike.length > 0) {
					this.idList = this.myAllLike.splice(0)
				} else {
					this.loadMoreText = "暂无更多点赞内容!"
					return;
				}
				this.idStr = this.idList.join()
				// // const writingDataUrl = this.dataPattern === 'new' ? `/writing/getSiftNew?page=${this.page}` : `/writing/getSiftHot?page=${this.page}`
				const { data } = await this.$myRequest({
					url: `/writing/getUserLikeWriting?id=${this.idStr}`
				})
				const myLike = data.data.map((item) => {
					return true
				})
				// if (data.data.length === 0) {
				// 	this.loadMoreText = "没有更多了啦!"
				// 	return;
				// }
				this.writingData = this.writingData.concat(data.data)
				this.myLike = this.myLike.concat(myLike)
			},
			// 点赞
			async actionsLikeClick(writing, index) {
				this.myLike[index] = !this.myLike[index]
				this.writingData[index].writing_like_count += this.myLike[index] ? 1 : -1
				const { data } = await this.$myRequest({
					url: '/like',
					method: 'POST',
					data: {
						condition: this.myLike[index] ? 1 : 0,
						user_id: this.userInfo.id,
						writing_id: writing.id,
						writer: writing.user.id,
						writing_like_count: this.writingData[index].writing_like_count
					}
				})
				// 缓存要传递的点赞状态
				const likeStatus = {
					writingId: writing.id,
					likeStatus: this.myLike[index],
					writing_like_count: this.writingData[index].writing_like_count
				}
				if(this.changeLikeList.length > 0) {
					for (let i = 0; i < this.changeLikeList.length; i++) {
						if(this.changeLikeList[i].writingId === likeStatus.writingId) {
							this.changeLikeList[i] = likeStatus
							return
						}
					}
					this.changeLikeList.push(likeStatus)
				} else {
					this.changeLikeList.push(likeStatus)
				}
			},
			// 评论详情页
			actionsCommentClick(item, index) {
				uni.navigateTo({
					url: `/pages/comment/comment?id=${item.id}&userId=${this.userInfo.id}`,
					events: {
						// 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
						// 被打开页面进行回调
						getNewData: data => {
							this.writingData[index].writing_like_count = data.likeCount,
							this.writingData[index].writing_comment_count = data.commentCount
						}
					},
					success: () => {
					},
					fail: () => {
					}
				})
			},
			// 跳转发表页
			toWritingPage() {
				uni.navigateTo({
					url: '/pages/WritingPage/WritingPage',
					success: () => {
					},
					fail: () => {
					}
				})
			},
			// 回到顶部
			toTop() {
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 300
				});
			},
			onPageScroll(e) {
				this.flag = e.scrollTop > 200 ? true : false
			}
		}
	}
</script>

<style lang="scss">
	page {
		background-color: #E8E8E8;
		height: 100%;
	}
	
	.top_right {
		display: flex;
		justify-content: flex-end;
		padding: 0 20px;
		color: #BBBBBB;
		text {
			padding: 0 2px;
		}
	}
	
	.addnew {
		position: fixed;
		right: 5px;
		bottom: 10px;
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
				
				.card-actions-item {
					margin-top: 10px;

					text {
						font-size: 8px;
					}
				}
			}
		}
	}
	
	.loadmore {
		text-align: center;
		margin-bottom: 5px;
		text{
			font-size: 12px;
			font-weight: 700;
		}
	}
		.toTop {
			position: fixed;
			right: 15px;
			bottom: 80px;
		}

</style>
