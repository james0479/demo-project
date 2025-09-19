# interview-platform-new
## 架构

```shell
├── backend
│   ├── create_test_data.py            # 测试数据生成脚本
│   ├── db.sqlite3                     # SQLite 数据库文件
│   ├── db.sqlite3.bak                 # 数据库备份文件
│   ├── interviews                     # 核心应用模块
│   │   ├── admin.py                   # Django admin 配置（面试相关）
│   │   ├── apps.py                    # 应用配置
│   │   ├── __init__.py
│   │   ├── migrations/                # 数据库迁移文件目录
│   │   ├── models.py                  # 面试相关主模型（如 Interview, Question 等）
│   │   ├── __pycache__/               # Python 编译缓存
│   │   ├── serializers.py             # 主序列化器（用于面试相关 API）
│   │   ├── student_admin.py           # 学生端专用的 admin 配置
│   │   ├── student_models.py          # 学生相关数据模型（如 StudentProfile）
│   │   ├── student_serializers.py     # 学生端专用序列化器
│   │   ├── student_views.py           # 学生端专用视图（API 接口）
│   │   ├── tests.py                   # 单元测试
│   │   ├── urls.py                    # 路由配置，包含主路由与学生端路由
│   │   └── views.py                   # 主视图函数或类（如管理员端接口）
│   ├── interview_system               # Django 项目配置目录
│   │   ├── __init__.py
│   │   ├── settings.py                # 项目设置
│   │   ├── urls.py                    # 项目总路由
│   │   └── wsgi.py
│   ├── manage.py                      # Django 管理脚本
│   ├── nohup.out                      # 后台运行日志输出
│   ├── requirements.txt               # Python 依赖列表
│   └── run.sh                         # 后端启动脚本
└── frontend                           # 前端项目根目录
    ├── index.html                     # 主页面（可能为管理员入口）
    ├── login.html                     # 登录页面
    ├── nohup.out                      # 前端运行日志（若使用 nohup 启动）
    ├── public/                        # 静态资源公共目录（如 favicon）
    ├── run.sh                         # 前端启动脚本
    └── src
        ├── api                        # API 请求封装（axios 实例、接口定义）
        ├── assets                     # 图片、样式等静态资源
        ├── components                 # 可复用的 Vue/React 组件
        ├── main.js                    # 前端主入口文件
        ├── main.js.bak                # 入口文件备份
        ├── main.jsv2                  # 入口文件的另一个版本或测试版本
        ├── students.js                # 学生相关页面逻辑或路由配置
        └── views                      # 页面级组件（如 LoginView, StudentDashboard 等）
```

## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin http://git.baway.work:10080/ai/interview-platform-new.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](http://git.baway.work:10080/ai/interview-platform-new/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/ee/user/project/merge_requests/merge_when_pipeline_succeeds.html)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/index.html)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
