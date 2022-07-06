<template>
	<view>
		<!-- 回到顶部 -->
		<view class="toTop">
			<uni-icons type="arrow-up" size="35" @click="toTop" :style="'display:' + (flag ? 'block' : 'none')"></uni-icons>
		</view>
		<view class="top_right">
			<view class="new" @click="changePattern('new')">
				<text :style="'color: ' + newColor">
					最新
				</text>
			</view>｜
			<view class="host" @click="changePattern('hot')">
				<text :style="'color: ' + hotColor">
					热门
				</text>
			</view>
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
				page: 0,
				showLoadMore: false,
				loadMoreText: "加载中...",
				dataPattern: 'new',
				newColor: '#000000',
				hotColor: '#7B7B7B',
				writingData: [],
				eventChannel: null,
				myAllLike: [],
				myLike: [],
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
		},
		onPullDownRefresh() {
			this.page = 0,
			this.getWriting();
			uni.stopPullDownRefresh();
		},
		onReachBottom() {
			this.loadMore()
		},
		onShow() {
			this.getUserInfo()
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
			},
			async getWriting() {
				this.getUserInfo()
				const writingDataUrl = this.dataPattern === 'new' ? `/writing/getSiftNew?page=0` : `/writing/getSiftHot?page=0`
				const { data } = await this.$myRequest({
					url: writingDataUrl
				})
				this.writingData = data.data
				this.writing_content = data.data.map((item) => {
					return item.writing_content
				})
				this.myLike = data.data.map((item, index) => {
					for(let i = 0; i < this.myAllLike.length; i++) {
						if(item.id === this.myAllLike[i]) {
							return true
						}
					}
					return false
				})
			},
			changePattern(dataPattern) {
				this.dataPattern = dataPattern
				if (dataPattern === 'new') {
					this.newColor = '#000000'
					this.hotColor = '#7B7B7B'
				} else {
					this.newColor = '#7B7B7B'
					this.hotColor = '#000000'
				}
				// this.getUserLikeList(this.userInfo.id)
				this.getWriting()
				this.page = 0
			},
			// 加载更多
			async loadMore() {
				this.showLoadMore = true;
				this.page++
				const writingDataUrl = this.dataPattern === 'new' ? `/writing/getSiftNew?page=${this.page}` : `/writing/getSiftHot?page=${this.page}`
				const { data } = await this.$myRequest({
					url: writingDataUrl
				})
				const myLike = data.data.map((item, index) => {
					for(let i = 0; i < this.myAllLike.length; i++) {
						if(item.id == this.myAllLike[i]) {
							return true
						}
					}
					return false
				})
				if (data.data.length === 0) {
					this.loadMoreText = "大哥，我真的已经没货啦!"
					return;
				}
				this.writingData = this.writingData.concat(data.data)
				this.myLike = this.myLike.concat(myLike)
			},
			// 点赞
			async actionsLikeClick(writing, index){
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
				this.changeLikeList.push(likeStatus)
				uni.$emit('updataChangeLikeList', this.changeLikeList)

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
					}
				})
			},
			// 跳转发表页
			toWritingPage() {
				uni.navigateTo({
					url: '/pages/WritingPage/WritingPage'
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
