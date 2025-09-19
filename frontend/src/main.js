const { createApp } = Vue;
const { ElMessage, ElMessageBox, ElLoading } = ElementPlus;

// 配置axios
const api = axios.create({
    baseURL: 'http://10.203.41.67:8000/api/',
    timeout: 10000,
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    }
});

// 添加CSRF token处理
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// 请求拦截器
api.interceptors.request.use(
    config => {
        const csrftoken = getCookie('csrftoken');
        if (csrftoken) {
            config.headers['X-CSRFToken'] = csrftoken;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            ElMessage.error('请先登录');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            window.location.href = '/login.html';
        }
        return Promise.reject(error);
    }
);

const App = {
    data() {
        return {
            activeMenu: 'dashboard',
            isCollapse: false,
            stats: {
                today_count: 0,
                week_count: 0,
                month_count: 0,
                pass_rate: 0,
                need_recording: 0
            },
            interviews: [],
            statusStats: [],
            calendarData: [],
            currentView: 'dashboard',
            userInfo: null,

            // 面试管理相关数据
            interviewManagement: {
                interviews: [],
                loading: false,
                pagination: {
                    currentPage: 1,
                    pageSize: 10,
                    total: 0
                },
                filters: {
                    status: '',
                    company: '',
                    candidate: '',
                    dateRange: [],
                    interviewer: ''
                },
                sort: {
                    prop: 'scheduled_time',
                    order: 'descending'
                }
            },
            interviewDetail: null,
            showDetailDialog: false,
            showEditDialog: false,
            editingInterview: {},

            // 登记功能相关数据
            showCreateDialog: false,
            newInterview: {
                candidate_name: '',
                candidate_phone: '',
                candidate_email: '',
                company_name: '',
                position_title: '',
                position_description: '',
                interview_method: 'video',
                interview_round: 'first',
                scheduled_time: '',
                duration: 60,
                interviewer_notes: ''
            },
            loading: false
        };
    },
    mounted() {
        // 加载用户信息
        const userInfoStr = localStorage.getItem('user_info');
        if (userInfoStr) {
            this.userInfo = JSON.parse(userInfoStr);
        }
        this.loadDashboardData();
    },
    methods: {
        async loadDashboardData() {
            try {
                const loading = ElLoading.service({ fullscreen: true });

                // 并行加载所有数据
                const [statsRes, interviewsRes] = await Promise.all([
                    api.get('dashboard/stats/'),
                    api.get('interviews/')
                ]);

                this.stats = statsRes.data;
                this.interviews = interviewsRes.data;
                this.statusStats = statsRes.data.status_stats || [];

                loading.close();
            } catch (error) {
                ElMessage.error('加载数据失败');
                console.error('Error loading data:', error);
            }
        },

        async logout() {
            try {
                await api.post('api-auth/logout/');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('登出错误:', error);
                // 即使登出API失败也清除本地存储
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
            }
        },

        // 面试管理方法
        async loadInterviewManagement() {
            this.interviewManagement.loading = true;
            try {
                const params = {
                    page: this.interviewManagement.pagination.currentPage,
                    page_size: this.interviewManagement.pagination.pageSize
                };

                // 添加筛选条件
                if (this.interviewManagement.filters.status) {
                    params.status = this.interviewManagement.filters.status;
                }
                if (this.interviewManagement.filters.company) {
                    params.company = this.interviewManagement.filters.company;
                }
                if (this.interviewManagement.filters.candidate) {
                    params.candidate_name = this.interviewManagement.filters.candidate;
                }
                if (this.interviewManagement.filters.dateRange && this.interviewManagement.filters.dateRange.length === 2) {
                    params.date_from = this.interviewManagement.filters.dateRange[0];
                    params.date_to = this.interviewManagement.filters.dateRange[1];
                }

                const response = await api.get('interviews/', { params });
                this.interviewManagement.interviews = response.data;
                this.interviewManagement.pagination.total = response.data.length;
                
            } catch (error) {
                ElMessage.error('加载面试数据失败');
                console.error('Error loading interviews:', error);
            } finally {
                this.interviewManagement.loading = false;
            }
        },

        async viewInterviewDetail(interview) {
            try {
                const response = await api.get(`interviews/${interview.id}/`);
                this.interviewDetail = response.data;
                this.showDetailDialog = true;
            } catch (error) {
                ElMessage.error('获取面试详情失败');
            }
        },

        async editInterview(interview) {
            this.editingInterview = { ...interview };
            this.showEditDialog = true;
        },

        async updateInterview() {
            try {
                await api.patch(`interviews/${this.editingInterview.id}/`, this.editingInterview);
                ElMessage.success('更新成功');
                this.showEditDialog = false;
                this.loadInterviewManagement();
            } catch (error) {
                ElMessage.error('更新失败');
            }
        },

        async deleteInterview(interviewId) {
            try {
                await ElMessageBox.confirm('确定要删除这个面试记录吗？', '确认删除', {
                    type: 'warning'
                });
                
                await api.delete(`interviews/${interviewId}/`);
                ElMessage.success('删除成功');
                this.loadInterviewManagement();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error('删除失败');
                }
            }
        },

        handleFilter() {
            this.interviewManagement.pagination.currentPage = 1;
            this.loadInterviewManagement();
        },

        handleSortChange(sort) {
            this.interviewManagement.sort = {
                prop: sort.prop,
                order: sort.order
            };
            this.loadInterviewManagement();
        },

        handlePageChange(page) {
            this.interviewManagement.pagination.currentPage = page;
            this.loadInterviewManagement();
        },

        async downloadRecording(interview) {
            if (interview.recording) {
                window.open(interview.recording, '_blank');
            } else {
                ElMessage.warning('没有录音文件');
            }
        },

        // 登记功能方法
        async openCreateDialog() {
            this.showCreateDialog = true;
        },

        async createInterview() {
            try {
                // 验证必填字段
                if (!this.validateForm()) {
                    return;
                }

                // 准备提交数据
                const postData = {
                    candidate_name: this.newInterview.candidate_name.trim(),
                    candidate_phone: this.newInterview.candidate_phone.trim(),
                    candidate_email: this.newInterview.candidate_email.trim(),
                    company_name: this.newInterview.company_name.trim(),
                    position_title: this.newInterview.position_title.trim(),
                    position_description: this.newInterview.position_description.trim(),
                    interview_method: this.newInterview.interview_method,
                    interview_round: this.newInterview.interview_round,
                    scheduled_time: this.newInterview.scheduled_time,
                    duration: Number(this.newInterview.duration),
                    interviewer_notes: this.newInterview.interviewer_notes.trim()
                };

                this.loading = true;
                const response = await api.post('interviews/', postData);
                ElMessage.success('面试登记成功！');
                this.showCreateDialog = false;
                this.loadDashboardData();
                this.resetForm();

            } catch (error) {
                console.error('完整错误信息:', error.response);
                console.error('错误数据:', error.response?.data);
                
                const errorData = error.response?.data;
                if (errorData) {
                    if (typeof errorData === 'object') {
                        let errorMessage = '请检查以下字段：';
                        for (const [field, messages] of Object.entries(errorData)) {
                            errorMessage += `\n${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
                        }
                        ElMessage.error(errorMessage);
                    } else {
                        ElMessage.error(errorData.detail || errorData.message || '登记失败');
                    }
                } else {
                    ElMessage.error('网络错误或服务器无响应');
                }
            } finally {
                this.loading = false;
            }
        },

        validateForm() {
            if (!this.newInterview.candidate_name.trim()) {
                ElMessage.warning('请输入候选人姓名');
                return false;
            }
            if (!this.newInterview.candidate_phone.trim()) {
                ElMessage.warning('请输入联系电话');
                return false;
            }
            if (!this.newInterview.company_name.trim()) {
                ElMessage.warning('请输入公司名称');
                return false;
            }
            if (!this.newInterview.position_title.trim()) {
                ElMessage.warning('请输入职位名称');
                return false;
            }
            if (!this.newInterview.scheduled_time) {
                ElMessage.warning('请选择面试时间');
                return false;
            }
            return true;
        },

        resetForm() {
            this.newInterview = {
                candidate_name: '',
                candidate_phone: '',
                candidate_email: '',
                company_name: '',
                position_title: '',
                position_description: '',
                interview_method: 'video',
                interview_round: 'first',
                scheduled_time: '',
                duration: 60,
                interviewer_notes: ''
            };
        },

        // 导航方法
        navigateTo(view) {
            this.currentView = view;
            if (view === 'dashboard') {
                this.loadDashboardData();
            } else if (view === 'interviews') {
                this.loadInterviewManagement();
            }
        },

        getStatusType(status) {
            const typeMap = {
                'scheduled': 'primary',
                'in_progress': 'warning',
                'completed': 'success',
                'cancelled': 'danger',
                'passed': 'success',
                'rejected': 'danger',
                'pending': 'info',
                'offer': 'success',
                'declined': 'danger'
            };
            return typeMap[status] || 'info';
        },

        getStatusText(status) {
            const textMap = {
                'scheduled': '已安排',
                'in_progress': '面试中',
                'completed': '已完成',
                'cancelled': '已取消',
                'passed': '通过',
                'rejected': '未通过',
                'pending': '待定',
                'offer': '发放Offer',
                'declined': '已拒绝'
            };
            return textMap[status] || status;
        },

        formatDateTime(datetime) {
            if (!datetime) return '';
            return new Date(datetime).toLocaleString('zh-CN');
        },

        async uploadRecording(interviewId) {
            try {
                const { value: file } = await ElMessageBox.prompt('请选择录音文件', '上传录音', {
                    inputType: 'file',
                    inputPlaceholder: '选择文件'
                });

                if (file) {
                    const formData = new FormData();
                    formData.append('recording', file);

                    await api.post(`interviews/${interviewId}/upload_recording/`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    ElMessage.success('录音上传成功');
                    this.loadDashboardData();
                }
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error('上传失败');
                }
            }
        },

        async completeInterview(interviewId) {
            try {
                await ElMessageBox.confirm('确定要完成这个面试吗？', '确认完成', {
                    type: 'warning'
                });

                await api.post(`interviews/${interviewId}/complete_interview/`);
                ElMessage.success('面试已完成');
                this.loadDashboardData();
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error('操作失败');
                }
            }
        }
    },
    template: `
        <el-container style="height: 100vh;">
            <el-header>
                <div style="display: flex; align-items: center;">
                    <h1 style="margin: 0; font-size: 24px;">🎯 面试管理平台</h1>
                </div>
                <div style="display: flex; align-items: center;">
                    <el-button type="primary" @click="openCreateDialog" style="margin-right: 15px;">
                        📝 登记面试
                    </el-button>
                    <span style="color: white; margin-right: 15px;">
                        欢迎，{{ userInfo?.username || '用户' }}
                    </span>
                    <el-button type="text" style="color: white;" @click="navigateTo('dashboard')">
                        首页
                    </el-button>
                    <el-button type="text" style="color: white;" @click="navigateTo('interviews')">
                        面试管理
                    </el-button>
                    <el-button type="text" style="color: white;" @click="navigateTo('stats')">
                        统计分析
                    </el-button>
                    <el-button type="text" style="color: white;" @click="logout">
                        退出登录
                    </el-button>
                </div>
            </el-header>

            <el-container>
                <el-aside width="200px">
                    <el-menu
                        :default-active="activeMenu"
                        background-color="#304156"
                        text-color="#bfcbd9"
                        active-text-color="#409EFF"
                        router
                    >
                        <el-menu-item index="dashboard" @click="navigateTo('dashboard')">
                            <i class="el-icon-data-line"></i>
                            <span>数据看板</span>
                        </el-menu-item>
                        <el-menu-item index="interviews" @click="navigateTo('interviews')">
                            <i class="el-icon-date"></i>
                            <span>面试管理</span>
                        </el-menu-item>
                        <el-menu-item index="stats" @click="navigateTo('stats')">
                            <i class="el-icon-s-data"></i>
                            <span>统计分析</span>
                        </el-menu-item>
                        <el-menu-item index="admin" @click="window.open('/admin/', '_blank')">
                            <i class="el-icon-s-tools"></i>
                            <span>管理后台</span>
                        </el-menu-item>
                    </el-menu>
                </el-aside>

                <el-main>
                    <div v-if="currentView === 'dashboard'">
                        <!-- 统计卡片 -->
                        <el-row :gutter="20">
                            <el-col :span="6">
                                <div class="stat-card">
                                    <div class="stat-title">今日面试</div>
                                    <div class="stat-value">{{ stats.today_count }}</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="stat-card">
                                    <div class="stat-title">本周面试</div>
                                    <div class="stat-value">{{ stats.week_count }}</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="stat-card">
                                    <div class="stat-title">本月面试</div>
                                    <div class="stat-value">{{ stats.month_count }}</div>
                                </div>
                            </el-col>
                            <el-col :span="6">
                                <div class="stat-card">
                                    <div class="stat-title">通过率</div>
                                    <div class="stat-value">{{ stats.pass_rate }}%</div>
                                </div>
                            </el-col>
                        </el-row>

                        <!-- 面试表格 -->
                        <div class="interview-table">
                            <h3>今日面试安排</h3>
                            <el-table :data="interviews" style="width: 100%">
                                <el-table-column prop="candidate_name" label="候选人" width="120"></el-table-column>
                                <el-table-column prop="company_name" label="公司" width="150"></el-table-column>
                                <el-table-column prop="position_title" label="职位" width="150"></el-table-column>
                                <el-table-column label="面试时间" width="180">
                                    <template #default="{row}">
                                        {{ formatDateTime(row.scheduled_time) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="状态" width="100">
                                    <template #default="{row}">
                                        <el-tag :type="getStatusType(row.status)" class="status-tag">
                                            {{ getStatusText(row.status) }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="结果" width="100">
                                    <template #default="{row}">
                                        <el-tag :type="getStatusType(row.result)" class="status-tag">
                                            {{ getStatusText(row.result) }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作" width="200">
                                    <template #default="{row}">
                                        <el-button
                                            v-if="row.status === 'completed' && !row.recording_uploaded"
                                            size="small"
                                            type="warning"
                                            @click="uploadRecording(row.id)"
                                        >
                                            上传录音
                                        </el-button>
                                        <el-button
                                            v-if="row.status !== 'completed'"
                                            size="small"
                                            type="primary"
                                            @click="completeInterview(row.id)"
                                        >
                                            完成面试
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </div>

                    <div v-else-if="currentView === 'interviews'">
                        <div class="dashboard-card">
                            <h3>面试管理</h3>
                            
                            <!-- 筛选条件 -->
                            <el-row :gutter="20" style="margin-bottom: 20px;">
                                <el-col :span="6">
                                    <el-input
                                        v-model="interviewManagement.filters.candidate"
                                        placeholder="候选人姓名"
                                        @change="handleFilter"
                                        clearable
                                    ></el-input>
                                </el-col>
                                <el-col :span="6">
                                    <el-input
                                        v-model="interviewManagement.filters.company"
                                        placeholder="公司名称"
                                        @change="handleFilter"
                                        clearable
                                    ></el-input>
                                </el-col>
                                <el-col :span="6">
                                    <el-select
                                        v-model="interviewManagement.filters.status"
                                        placeholder="状态筛选"
                                        @change="handleFilter"
                                        clearable
                                    >
                                        <el-option label="已安排" value="scheduled"></el-option>
                                        <el-option label="面试中" value="in_progress"></el-option>
                                        <el-option label="已完成" value="completed"></el-option>
                                        <el-option label="已取消" value="cancelled"></el-option>
                                    </el-select>
                                </el-col>
                                <el-col :span="6">
                                    <el-date-picker
                                        v-model="interviewManagement.filters.dateRange"
                                        type="daterange"
                                        range-separator="至"
                                        start-placeholder="开始日期"
                                        end-placeholder="结束日期"
                                        @change="handleFilter"
                                        style="width: 100%"
                                    ></el-date-picker>
                                </el-col>
                            </el-row>

                            <!-- 面试表格 -->
                            <el-table
                                :data="interviewManagement.interviews"
                                v-loading="interviewManagement.loading"
                                @sort-change="handleSortChange"
                                style="width: 100%"
                            >
                                <el-table-column prop="candidate_name" label="候选人" sortable width="120"></el-table-column>
                                <el-table-column prop="company_name" label="公司" sortable width="150"></el-table-column>
                                <el-table-column prop="position_title" label="职位" width="150"></el-table-column>
                                <el-table-column label="面试时间" width="180" sortable="custom">
                                    <template #default="{row}">
                                        {{ formatDateTime(row.scheduled_time) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="面试方式" width="100">
                                    <template #default="{row}">
                                        {{ row.interview_method === 'phone' ? '电话' : row.interview_method === 'video' ? '视频' : '现场' }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="状态" width="100" sortable="custom">
                                    <template #default="{row}">
                                        <el-tag :type="getStatusType(row.status)" class="status-tag">
                                            {{ getStatusText(row.status) }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="结果" width="100" sortable="custom">
                                    <template #default="{row}">
                                        <el-tag :type="getStatusType(row.result)" class="status-tag">
                                            {{ getStatusText(row.result) }}
                                        </el-tag>
                                    </template>
                                </el-table-column>
                                <el-table-column label="评分" width="80">
                                    <template #default="{row}">
                                        {{ row.score || '-' }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="录音" width="80">
                                    <template #default="{row}">
                                        <el-icon v-if="row.recording_uploaded" style="color: #67C23A;">
                                            <el-tooltip content="点击下载录音">
                                                <el-link :underline="false" @click="downloadRecording(row)">
                                                    <el-icon><headset /></el-icon>
                                                </el-link>
                                            </el-tooltip>
                                        </el-icon>
                                        <el-icon v-else style="color: #909399;">
                                            <el-icon><headset /></el-icon>
                                        </el-icon>
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作" width="200" fixed="right">
                                    <template #default="{row}">
                                        <el-button size="small" @click="viewInterviewDetail(row)">
                                            详情
                                        </el-button>
                                        <el-button size="small" type="primary" @click="editInterview(row)">
                                            编辑
                                        </el-button>
                                        <el-button size="small" type="danger" @click="deleteInterview(row.id)">
                                            删除
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>

                            <!-- 分页 -->
                            <el-pagination
                                style="margin-top: 20px;"
                                :current-page="interviewManagement.pagination.currentPage"
                                :page-size="interviewManagement.pagination.pageSize"
                                :total="interviewManagement.pagination.total"
                                @current-change="handlePageChange"
                                layout="total, prev, pager, next, jumper"
                            ></el-pagination>
                        </div>
                    </div>

                    <div v-else-if="currentView === 'stats'">
                        <div class="dashboard-card">
                            <h3>统计分析</h3>
                            <p>这里可以显示各种统计图表和分析报告</p>
                        </div>
                    </div>
                </el-main>
            </el-container>

            <!-- 面试详情对话框 -->
            <el-dialog
                v-model="showDetailDialog"
                title="面试详情"
                width="800px"
            >
                <div v-if="interviewDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="候选人">{{ interviewDetail.candidate_name }}</el-descriptions-item>
                        <el-descriptions-item label="联系电话">{{ interviewDetail.candidate_phone }}</el-descriptions-item>
                        <el-descriptions-item label="邮箱">{{ interviewDetail.candidate_email }}</el-descriptions-item>
                        <el-descriptions-item label="公司">{{ interviewDetail.company_name }}</el-descriptions-item>
                        <el-descriptions-item label="职位">{{ interviewDetail.position_title }}</el-descriptions-item>
                        <el-descriptions-item label="面试方式">
                            {{ interviewDetail.interview_method === 'phone' ? '电话面试' : 
                               interviewDetail.interview_method === 'video' ? '视频面试' : '现场面试' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="面试轮次">
                            {{ interviewDetail.interview_round === 'first' ? '初试' : 
                               interviewDetail.interview_round === 'second' ? '二面' : 
                               interviewDetail.interview_round === 'third' ? '三面' : '终面' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="面试时间">{{ formatDateTime(interviewDetail.scheduled_time) }}</el-descriptions-item>
                        <el-descriptions-item label="预计时长">{{ interviewDetail.duration }}分钟</el-descriptions-item>
                        <el-descriptions-item label="状态">
                            <el-tag :type="getStatusType(interviewDetail.status)">
                                {{ getStatusText(interviewDetail.status) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="结果">
                            <el-tag :type="getStatusType(interviewDetail.result)">
                                {{ getStatusText(interviewDetail.result) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="评分">{{ interviewDetail.score || '未评分' }}</el-descriptions-item>
                    </el-descriptions>

                    <el-divider></el-divider>

                    <h4>面试反馈</h4>
                    <el-input
                        :model-value="interviewDetail.feedback"
                        type="textarea"
                        :rows="4"
                        readonly
                        placeholder="暂无反馈"
                    ></el-input>

                    <h4 style="margin-top: 20px;">面试官备注</h4>
                    <el-input
                        :model-value="interviewDetail.interviewer_notes"
                        type="textarea"
                        :rows="3"
                        readonly
                        placeholder="暂无备注"
                    ></el-input>
                </div>
            </el-dialog>

            <!-- 编辑面试对话框 -->
            <el-dialog
                v-model="showEditDialog"
                title="编辑面试信息"
                width="600px"
            >
                <el-form :model="editingInterview" label-width="100px">
                    <el-form-item label="状态">
                        <el-select v-model="editingInterview.status">
                            <el-option label="已安排" value="scheduled"></el-option>
                            <el-option label="面试中" value="in_progress"></el-option>
                            <el-option label="已完成" value="completed"></el-option>
                            <el-option label="已取消" value="cancelled"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="结果">
                        <el-select v-model="editingInterview.result">
                            <el-option label="待定" value="pending"></el-option>
                            <el-option label="通过" value="passed"></el-option>
                            <el-option label="未通过" value="rejected"></el-option>
                            <el-option label="发放Offer" value="offer"></el-option>
                            <el-option label="已拒绝" value="declined"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="评分">
                        <el-input-number
                            v-model="editingInterview.score"
                            :min="1"
                            :max="100"
                            controls-position="right"
                        ></el-input-number>
                    </el-form-item>
                    <el-form-item label="面试反馈">
                        <el-input
                            v-model="editingInterview.feedback"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入面试反馈"
                        ></el-input>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showEditDialog = false">取消</el-button>
                    <el-button type="primary" @click="updateInterview">保存</el-button>
                </template>
            </el-dialog>

            <!-- 登记面试对话框 -->
            <el-dialog
                v-model="showCreateDialog"
                title="📝 登记新面试"
                width="700px"
                :close-on-click-modal="false"
            >
                <el-form :model="newInterview" label-width="100px" v-loading="loading">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="候选人姓名" required>
                                <el-input
                                    v-model="newInterview.candidate_name"
                                    placeholder="请输入候选人姓名"
                                    clearable
                                ></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="联系电话" required>
                                <el-input
                                    v-model="newInterview.candidate_phone"
                                    placeholder="请输入联系电话"
                                    clearable
                                ></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item label="邮箱">
                        <el-input
                            v-model="newInterview.candidate_email"
                            placeholder="请输入邮箱地址"
                            clearable
                        ></el-input>
                    </el-form-item>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="公司名称" required>
                                <el-input
                                    v-model="newInterview.company_name"
                                    placeholder="请输入公司名称"
                                    clearable
                                ></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="职位名称" required>
                                <el-input
                                    v-model="newInterview.position_title"
                                    placeholder="请输入职位名称"
                                    clearable
                                ></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item label="岗位描述">
                        <el-input
                            v-model="newInterview.position_description"
                            type="textarea"
                            :rows="3"
                            placeholder="请输入岗位描述（可选）"
                            resize="none"
                        ></el-input>
                    </el-form-item>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="面试方式">
                                <el-select v-model="newInterview.interview_method" placeholder="请选择面试方式">
                                    <el-option label="电话面试" value="phone"></el-option>
                                    <el-option label="视频面试" value="video"></el-option>
                                    <el-option label="现场面试" value="onsite"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="面试轮次">
                                <el-select v-model="newInterview.interview_round" placeholder="请选择面试轮次">
                                    <el-option label="初试" value="first"></el-option>
                                    <el-option label="二面" value="second"></el-option>
                                    <el-option label="三面" value="third"></el-option>
                                    <el-option label="终面" value="final"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="面试时间" required>
                                <el-date-picker
                                    v-model="newInterview.scheduled_time"
                                    type="datetime"
                                    placeholder="选择面试日期和时间"
                                    format="YYYY-MM-DD HH:mm"
                                    value-format="YYYY-MM-DDTHH:mm:ss"
                                    style="width: 100%"
                                ></el-date-picker>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="预计时长">
                                <el-input-number
                                    v-model="newInterview.duration"
                                    :min="15"
                                    :max="180"
                                    :step="15"
                                    controls-position="right"
                                ></el-input-number>
                                <span style="margin-left: 8px; color: #666;">分钟</span>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item label="备注信息">
                        <el-input
                            v-model="newInterview.interviewer_notes"
                            type="textarea"
                            :rows="3"
                            placeholder="请输入备注信息（可选）"
                            resize="none"
                        ></el-input>
                    </el-form-item>
                </el-form>

                <template #footer>
                    <el-button @click="showCreateDialog = false">取消</el-button>
                    <el-button type="primary" @click="createInterview" :loading="loading">
                        确认登记
                    </el-button>
                </template>
            </el-dialog>
        </el-container>
    `
};

createApp(App).use(ElementPlus).mount('#app');
