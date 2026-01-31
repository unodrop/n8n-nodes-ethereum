# n8n-nodes-ethereum

This is an n8n community node. It lets you use GitHub Issues in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## 本地 n8n 服务如何加载本节点

有两种常用方式，任选其一即可。

### 方式一：用本仓库自带的开发命令（推荐，最简单）

在**本仓库根目录**执行：

```bash
npm run build
npm run dev
```

- `npm run dev` 会：编译代码、把本包链接到 n8n 的 custom 目录、并启动一个 n8n 实例。
- 浏览器打开 **http://localhost:5678**，在节点面板里搜索 **Ethereum** 或 **Ethereum Sign** / **Ethereum Create Wallet** 即可使用。

适合：本地开发、快速试用，无需单独安装或配置 n8n。

---

### 方式二：让你已有的本地 n8n 加载本节点

适用于：你已经用 `npm install n8n -g`、Docker、或其它方式跑着 n8n，希望在这个实例里用本节点。

#### 1. 构建本节点

在本仓库根目录执行：

```bash
npm run build
npm link
```

#### 2. 让 n8n 能找到本节点

n8n 会从「自定义扩展目录」里的 `node_modules` 加载社区节点，默认目录是 **`~/.n8n/custom`**（Windows 为 `%USERPROFILE%\.n8n\custom`）。

**若该目录不存在，先创建并初始化：**

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
npm init -y
```

**在该目录里链接本节点：**

```bash
cd ~/.n8n/custom
npm link n8n-nodes-ethereum
```

（若你改了 `package.json` 里的 `name`，这里要换成对应的包名。）

#### 3. 启动 n8n

按你平时的方式启动 n8n，例如：

```bash
n8n start
```

或 Docker / 其它方式。启动后打开 n8n 界面，在节点面板搜索 **Ethereum** 或 **Ethereum Sign** / **Ethereum Create Wallet**，即可拖入工作流使用。

#### 若你用了自定义数据目录（N8N_USER_FOLDER）

若启动 n8n 时设置了 `N8N_USER_FOLDER`（例如 Docker 挂载了别的目录），则 custom 目录在 **`<N8N_USER_FOLDER>/.n8n/custom`**。请在该路径下执行上面的 `mkdir`、`npm init -y` 和 `npm link n8n-nodes-ethereum`，再重启 n8n。

#### 若想指定其它目录加载本节点

可设置环境变量 **`N8N_CUSTOM_EXTENSIONS`**，值为一个或多个目录（多个用分号 `;` 分隔）。每个目录需像 `~/.n8n/custom` 一样，里面有 `node_modules`，且通过 `npm link n8n-nodes-ethereum` 或拷贝方式存在 `n8n-nodes-ethereum` 包。例如：

```bash
export N8N_CUSTOM_EXTENSIONS="/path/to/your/custom-nodes-folder"
n8n start
```

---

### 小结

| 方式 | 适用场景 |
|------|----------|
| **方式一** `npm run dev` | 在本仓库里开发、调试、快速试用，不碰已有 n8n 环境。 |
| **方式二** `npm link` + 默认/自定义 custom 目录 | 在你已经跑着的本地 n8n 里使用本节点。 |

节点名称：在 n8n 里搜索 **Ethereum Sign**（签名）、**Ethereum Create Wallet**（创建钱包），不是包名 `n8n-nodes-ethereum`。

## Debugging (调试)

在 VS Code / Cursor 中调试本仓库的节点（如 Ethereum Sign）：

### 方式一：先启动 n8n，再附加调试器（推荐）

1. **创建 symlink 并构建**（首次或改代码后执行一次）：
   ```bash
   npm run dev
   ```
   等终端出现 “Editor is now accessible” 后按 `Ctrl+C` 停止，或保持运行进入下一步。

2. **在源码里打断点**  
   在 `nodes/EthereumSign/EthereumSign.node.ts` 等需要调试的 `.ts` 文件左侧行号处点击，设置断点。

3. **附加到 n8n 进程**  
   - 若上一步已停止：在终端执行 `npm run dev` 再次启动 n8n。  
   - 在 VS Code 左侧选择 **Run and Debug**，配置选 **“Attach to running n8n”**。  
   - 若使用“Attach to running n8n”：点击绿色三角启动，在进程列表里选择 **Node** 进程（通常为 `n8n` 或带 `n8n` 路径的那一项）。  
   - 若使用“Attach to running n8n”且端口 9229：需先让 n8n 以 `--inspect` 启动（见方式二），再选该配置并启动。

4. **触发节点**  
   在浏览器打开 http://localhost:5678，编辑工作流并执行包含 Ethereum Sign 的流程，断点会命中。

### 方式二：用 VS Code 直接启动带 inspect 的 n8n

1. **确保已跑过一次 dev**（生成 symlink）并构建：
   ```bash
   npm run dev
   # 出现 "Editor is now accessible" 后 Ctrl+C
   npm run build
   ```

2. 在 **Run and Debug** 里选择 **“Launch n8n with inspect”**，按 F5 启动。

3. 在 `EthereumSign.node.ts` 等处打断点，在 n8n 里执行工作流即可命中断点。

### 说明

- 构建产物在 `dist/`，带 source map，断点打在 **.ts 源码** 上即可。  
- 若附加后断点不命中，确认选中的是运行 n8n 的 Node 进程，且执行路径确实经过了你的节点。

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Issues
    - Get an issue
    - Get many issues in a repository
    - Create a new issue
- Issue Comments
    - Get many issue comments

## Credentials

You can use either access token or OAuth2 to use this node.

### Access token

1. Open your GitHub profile [Settings](https://github.com/settings/profile).
2. In the left navigation, select [Developer settings](https://github.com/settings/apps).
3. In the left navigation, under Personal access tokens, select Tokens (classic).
4. Select Generate new token > Generate new token (classic).
5. Enter a descriptive name for your token in the Note field, like n8n integration.
6. Select the Expiration you'd like for the token, or select No expiration.
7. Select Scopes for your token. For most of the n8n GitHub nodes, add the `repo` scope.
    - A token without assigned scopes can only access public information.
8. Select Generate token.
9. Copy the token.

Refer to [Creating a personal access token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) for more information. Refer to Scopes for OAuth apps for more information on GitHub scopes.

![Generated Access token in GitHub](https://docs.github.com/assets/cb-17251/mw-1440/images/help/settings/personal-access-tokens.webp)

### OAuth2

If you're self-hosting n8n, create a new GitHub [OAuth app](https://docs.github.com/en/apps/oauth-apps):

1. Open your GitHub profile [Settings](https://github.com/settings/profile).
2. In the left navigation, select [Developer settings](https://github.com/settings/apps).
3. In the left navigation, select OAuth apps.
4. Select New OAuth App.
    - If you haven't created an app before, you may see Register a new application instead. Select it.
5. Enter an Application name, like n8n integration.
6. Enter the Homepage URL for your app's website.
7. If you'd like, add the optional Application description, which GitHub displays to end-users.
8. From n8n, copy the OAuth Redirect URL and paste it into the GitHub Authorization callback URL.
9. Select Register application.
10. Copy the Client ID and Client Secret this generates and add them to your n8n credential.

Refer to the [GitHub Authorizing OAuth apps documentation](https://docs.github.com/en/apps/oauth-apps/using-oauth-apps/authorizing-oauth-apps) for more information on the authorization process.

## Compatibility

Compatible with n8n@1.60.0 or later

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [GitHub API docs](https://docs.github.com/en/rest/issues)
