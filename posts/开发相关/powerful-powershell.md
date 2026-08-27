---
published: 2023-01-13
---

# 打造一个强大的 PowerShell 终端 =)

## 正文

打造一个强大的 PowerShell 终端。

## 注意

请使用 PowerShell 7。

## 安装所需要的软件

这里我使用 Scoop 进行安装，如果本地没有 Scoop 的话可以去看看 [这篇文章](/posts/%E5%BC%80%E5%8F%91%E7%9B%B8%E5%85%B3/hey-managers.html)。

```bash
$ scoop install pscolor posh-cargo posh-docker posh-git scoop-completion dockercompletion bottom starship zoxide git-aliases hub
```


我的 PowerShell 配置：

```powershell
using namespace System.Management.Automation
using namespace System.Management.Automation.Language

#############################
# Encoding
#############################

# 编码
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding

#############################
# PSReadLine
#############################

Import-Module PSReadLine

# 补全括号和引号
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadlineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadlineKeyHandler -Key DownArrow -Function HistorySearchForward

Set-PSReadLineOption -Predictionsource History

# Smart Insertion

Set-PSReadLineKeyHandler -Key '"', "'" `
    -BriefDescription SmartInsertQuote `
    -LongDescription "Insert paired quotes if not already on a quote" `
    -ScriptBlock {
    param($key, $arg)

    $quote = $key.KeyChar

    $selectionStart = $null
    $selectionLength = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetSelectionState([ref]$selectionStart, [ref]$selectionLength)

    $line = $null
    $cursor = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)

    # If text is selected, just quote it without any smarts
    if ($selectionStart -ne -1) {
        [Microsoft.PowerShell.PSConsoleReadLine]::Replace($selectionStart, $selectionLength, $quote + $line.SubString($selectionStart, $selectionLength) + $quote)
        [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($selectionStart + $selectionLength + 2)
        return
    }

    $ast = $null
    $tokens = $null
    $parseErrors = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$ast, [ref]$tokens, [ref]$parseErrors, [ref]$null)

    function FindToken {
        param($tokens, $cursor)

        foreach ($token in $tokens) {
            if ($cursor -lt $token.Extent.StartOffset) { continue }
            if ($cursor -lt $token.Extent.EndOffset) {
                $result = $token
                $token = $token -as [StringExpandableToken]
                if ($token) {
                    $nested = FindToken $token.NestedTokens $cursor
                    if ($nested) { $result = $nested }
                }

                return $result
            }
        }
        return $null
    }

    $token = FindToken $tokens $cursor

    # If we're on or inside a **quoted** string token (so not generic), we need to be smarter
    if ($token -is [StringToken] -and $token.Kind -ne [TokenKind]::Generic) {
        # If we're at the start of the string, assume we're inserting a new string
        if ($token.Extent.StartOffset -eq $cursor) {
            [Microsoft.PowerShell.PSConsoleReadLine]::Insert("$quote$quote ")
            [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($cursor + 1)
            return
        }

        # If we're at the end of the string, move over the closing quote if present.
        if ($token.Extent.EndOffset -eq ($cursor + 1) -and $line[$cursor] -eq $quote) {
            [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($cursor + 1)
            return
        }
    }

    if ($null -eq $token -or
        $token.Kind -eq [TokenKind]::RParen -or $token.Kind -eq [TokenKind]::RCurly -or $token.Kind -eq [TokenKind]::RBracket) {
        if ($line[0..$cursor].Where{ $_ -eq $quote }.Count % 2 -eq 1) {
            # Odd number of quotes before the cursor, insert a single quote
            [Microsoft.PowerShell.PSConsoleReadLine]::Insert($quote)
        } else {
            # Insert matching quotes, move cursor to be in between the quotes
            [Microsoft.PowerShell.PSConsoleReadLine]::Insert("$quote$quote")
            [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($cursor + 1)
        }
        return
    }

    # If cursor is at the start of a token, enclose it in quotes.
    if ($token.Extent.StartOffset -eq $cursor) {
        if ($token.Kind -eq [TokenKind]::Generic -or $token.Kind -eq [TokenKind]::Identifier -or
            $token.Kind -eq [TokenKind]::Variable -or $token.TokenFlags.hasFlag([TokenFlags]::Keyword)) {
            $end = $token.Extent.EndOffset
            $len = $end - $cursor
            [Microsoft.PowerShell.PSConsoleReadLine]::Replace($cursor, $len, $quote + $line.SubString($cursor, $len) + $quote)
            [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($end + 2)
            return
        }
    }

    # We failed to be smart, so just insert a single quote
    [Microsoft.PowerShell.PSConsoleReadLine]::Insert($quote)
}

Set-PSReadLineKeyHandler -Key '(', '{', '[' `
    -BriefDescription InsertPairedBraces `
    -LongDescription "Insert matching braces" `
    -ScriptBlock {
    param($key, $arg)

    $closeChar = switch ($key.KeyChar) {
        <#case#> '(' { [char]')'; break }
        <#case#> '{' { [char]'}'; break }
        <#case#> '[' { [char]']'; break }
    }

    $selectionStart = $null
    $selectionLength = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetSelectionState([ref]$selectionStart, [ref]$selectionLength)

    $line = $null
    $cursor = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)

    if ($selectionStart -ne -1) {
        # Text is selected, wrap it in brackets
        [Microsoft.PowerShell.PSConsoleReadLine]::Replace($selectionStart, $selectionLength, $key.KeyChar + $line.SubString($selectionStart, $selectionLength) + $closeChar)
        [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($selectionStart + $selectionLength + 2)
    } else {
        # No text is selected, insert a pair
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert("$($key.KeyChar)$closeChar")
        [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($cursor + 1)
    }
}

Set-PSReadLineKeyHandler -Key ')', ']', '}' `
    -BriefDescription SmartCloseBraces `
    -LongDescription "Insert closing brace or skip" `
    -ScriptBlock {
    param($key, $arg)

    $line = $null
    $cursor = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)

    if ($line[$cursor] -eq $key.KeyChar) {
        [Microsoft.PowerShell.PSConsoleReadLine]::SetCursorPosition($cursor + 1)
    } else {
        [Microsoft.PowerShell.PSConsoleReadLine]::Insert("$($key.KeyChar)")
    }
}

Set-PSReadLineKeyHandler -Key Backspace `
    -BriefDescription SmartBackspace `
    -LongDescription "Delete previous character or matching quotes/parens/braces" `
    -ScriptBlock {
    param($key, $arg)

    $line = $null
    $cursor = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)

    if ($cursor -gt 0) {
        $toMatch = $null
        if ($cursor -lt $line.Length) {
            switch ($line[$cursor]) {
                <#case#> '"' { $toMatch = '"'; break }
                <#case#> "'" { $toMatch = "'"; break }
                <#case#> ')' { $toMatch = '('; break }
                <#case#> ']' { $toMatch = '['; break }
                <#case#> '}' { $toMatch = '{'; break }
            }
        }

        if ($toMatch -ne $null -and $line[$cursor - 1] -eq $toMatch) {
            [Microsoft.PowerShell.PSConsoleReadLine]::Delete($cursor - 1, 2)
        } else {
            [Microsoft.PowerShell.PSConsoleReadLine]::BackwardDeleteChar($key, $arg)
        }
    }
}

#############################
# Highlighting
#############################

# 高亮
Import-Module PSColor
# Import-Module syntax-highlighting

#############################
# Completions
#############################

# 自动补全
Import-Module $Env:SCOOP\modules\posh-cargo
Import-Module $Env:SCOOP\modules\posh-docker
Import-Module $Env:SCOOP\modules\posh-git
Import-Module $Env:SCOOP\modules\scoop-completion
Import-Module $Env:SCOOP\modules\dockercompletion
Import-Module $Env:SCOOP\apps\bottom\current\completion\_btm.ps1
starship completions powershell | Out-String | Invoke-Expression
# 注意：以下补全为开发环境的补全，你的电脑上可能没有装，请自行删除 =v=
rustup completions powershell | Out-String | Invoke-Expression
fnm completions --shell powershell | Out-String | Invoke-Expression
dvm completions powershell | Out-String | Invoke-Expression
deno completions powershell --unstable | Out-String | Invoke-Expression
# (& conda 'shell.powershell' 'hook') | Out-String | Invoke-Expression
(& volta completions powershell) | Out-String | Invoke-Expression
Invoke-Expression (& { $hook = if ($PSVersionTable.PSVersion.Major -ge 6) { 'pwd' } else { 'prompt' } (zoxide init powershell --hook $hook | Out-String) })

#############################
# Starship
#############################

# 初始化Starship，这一块之后会讲
Invoke-Expression (&starship init powershell)

#############################
# Rust
#############################

# Rustup
# 设置Rustup的镜像
$Env:RUSTUP_DIST_SERVER = "https://mirrors.ustc.edu.cn/rust-static"
$Env:RUSTUP_UPDATE_ROOT = "https://mirrors.ustc.edu.cn/rust-static/rustup"

#############################
# fnm
#############################

# 设置FNM镜像和安装目录
$Env:FNM_DIR = "D:\.fnm"
$Env:FNM_NODE_DIST_MIRROR = "https://cdn.npmmirror.com/binaries/node"

fnm env --use-on-cd | Out-String | Invoke-Expression

#############################
# PyEnv
#############################

# $Env:PYTHON_BUILD_MIRROR_URL = "https://npm.taobao.org/mirrors/python"

#############################
# Zoxide alias
# Well, this should be here
#############################

# Remove-Alias -Name cd -Force
# Set-Alias cd z

#############################
# PNPM
#############################

# 设置PNPM目录
$Env:PNPM_HOME = "D:\.pnpm"
$Env:Path += ";$Env:PNPM_HOME"

#############################
# Path
#############################

# 添加deno install目录
$Env:Path += ";C:\Users\Hatsune_Miku\.deno\bin"

#############################
# Aliases
#############################

# Fix @antfu/ni
Remove-Alias -Name ni -Force
# Fix Scoop Install alias
Remove-Alias -Name si -Force

# Git
Import-Module git-aliases -DisableNameChecking
Set-Alias git hub
Set-Alias code code-insiders

# 一些缩写，同样你的电脑上可能没有装，请自行删除
# Node
# 这里需要你npm安装@antfu/ni
function nio { ni --prefer-offline @Args }
function nid { ni -D @Args }
function nd { nr dev @Args }
function ns { nr start @Args }
function nb { nr build @Args }
function nbw { nr build --watch @Args }
function nt { nr test @Args }
function ntu { nr test -u @Args }
function ntw { nr test --watch @Args }
function nw { nr watch @Args }
function np { pnpm publish --access public --no-git-checks @Args }
function nc { nr typecheck @Args }
function nl { nr lint @Args }
function nlf { nr lint --fix @Args }
function nrelease { nr release @Args }
function nre { nr release @Args }

# 这里需要你npm安装taze
function vc { nx vercel@latest @Args }
function taze { nx taze@latest @Args }
function tzm { taze major @Args }
function tz { taze major -wfri @Args }
function giget { nx giget@latest @Args }
function vcp { vc --prod @Args }

# Deno
# 这里需要你deno安装deployctl
function dctl { deployctl deploy @Args }
function dctlp { dctl --prod @Args }

# Go
# 这里需要你安装Go
function gg { go get @Args }
function gmt { go mod tidy @Args }
function gmi { go mod init @Args }
function gt { go test @Args }
function gta { go test ./... @Args }

# Python
# 这里需要你安装Python
function pi { pip install @Args }
function pu { pip install --upgrade @Args }
function pup { pu pip }

# Misc
# 这里需要你安装you-get和scoop
function yg { you-get -o="D:\.you-get" @Args } # You-get
function si { scoop install @Args } # Scoop Install
function sun { scoop uninstall @Args } # Scoop Uninstall
# 代理
function proxy {
    $Env:http_proxy = "http://127.0.0.1:7890"
    $Env:https_proxy = "http://127.0.0.1:7890"
}
function unproxy {
    $Env:http_proxy = ""
    $Env:https_proxy = ""
}
# 安装夜间版Node
function fnmn { fnm --node-dist-mirror https://nodejs.org/download/nightly/ @Args }
function Rename-Branch {
    git branch -m $Args[0] $Args[1]
    git fetch origin
    git branch -u "origin/$Args[1]" $Args[1]
    git remote set-head origin -a
}

# INIT Proxy

proxy
```
