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

            // 新增登记功能相关数据
            showCreateDialog: false,
            newInterview: {
                candidate_name: '',
                candidate_phone: '',
                candidate_email: '',
                company_name: '',          // 改为文本输入
                position_title: '',        // 改为文本输入
                position_description: '',  // 新增岗位描述
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

        // 新增登记功能方法
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
                    company_name: this.newInterview.company_name.trim(),              // 直接使用文本
                    position_title: this.newInterview.position_title.trim(),          // 直接使用文本
                    position_description: this.newInterview.position_description.trim(), // 新增岗位描述
                    interview_method: this.newInterview.interview_method,
                    interview_round: this.newInterview.interview_round,
                    scheduled_time: this.newInterview.scheduled_time,
                    duration: Number(this.newInterview.duration),
                    interviewer_notes: this.newInterview.interviewer_notes.trim()
                };

                console.log('提交数据:', JSON.stringify(postData, null, 2));

                this.loading = true;
                const response = await api.post('interviews/', postData);
                ElMessage.success('面试登记成功！');
                this.showCreateDialog = false;
                this.loadDashboardData();
                this.resetForm();

            } catch (error) {
                console.error('完整错误信息:', error.response);
                console.error('错误数据:', error.response?.data);
                
                // 更详细的错误处理
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

        // 原有方法
        navigateTo(view) {
            this.currentView = view;
            if (view === 'dashboard') {
                this.loadDashboardData();
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
                            <p>这里可以显示所有面试的详细管理功能</p>
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
