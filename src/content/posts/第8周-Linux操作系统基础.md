---
title: "Linux操作系统基础"
date: "2026-05-09"
excerpt: "文件系统和设备管理、Linux内存管理"
cover_url: ""
tags: ["Linux","操作系统"]
---

# 第8周：Linux操作系统基础

> 学习重点：文件系统和设备管理、Linux内存管理
> 
> **核心目标：** 理解Linux底层文件系统和内存管理机制，掌握如何在Qt中高效运用这些知识

---

## 一、Linux文件系统深度解析

### 1.1 文件系统树状结构

Linux的文件系统像一棵倒立的树：

```
/                    ← 根目录（一切从这里开始）
├── bin              ← 常用命令（ls, cp, mv等）
├── etc              ← 配置文件
├── home             ← 用户家目录
│   └── chenxi       ← 你的家目录 ~
├── tmp              ← 临时文件
├── var              ← 可变数据（日志等）
├── usr              ← 用户程序
├── dev              ← 设备文件
└── proc             ← 进程信息（虚拟文件系统）
```

**详细目录说明：**

| 目录 | 用途 | 重要性 |
|------|------|--------|
| `/` | 根目录，所有文件系统的起点 | ★★★★★ |
| `/bin` | 基本命令二进制文件 | ★★★★ |
| `/boot` | 启动文件（内核、grub） | ★★★ |
| `/dev` | 设备文件（硬盘、USB等） | ★★★★★ |
| `/etc` | 系统配置文件 | ★★★★★ |
| `/home` | 用户家目录 | ★★★★★ |
| `/lib` | 共享库文件 | ★★★★ |
| `/media` | 可移动媒体挂载点 | ★★★ |
| `/mnt` | 临时挂载点 | ★★★ |
| `/opt` | 可选应用程序包 | ★★ |
| `/proc` | 进程和内核信息（虚拟） | ★★★★★ |
| `/root` | root用户家目录 | ★★★ |
| `/run` | 运行时变量数据 | ★★★★ |
| `/sbin` | 系统管理命令 | ★★★★ |
| `/srv` | 服务数据 | ★★ |
| `/sys` | 系统信息（虚拟） | ★★★★ |
| `/tmp` | 临时文件 | ★★★ |
| `/usr` | 用户程序和文件 | ★★★★★ |
| `/var` | 可变数据（日志、邮件等） | ★★★★★ |

### 1.2 一切皆文件

在Linux中，**一切皆文件**：
- 普通文件：`hello.txt`
- 目录：`/home`
- 设备：`/dev/sda`（硬盘）
- 管道：`/tmp/pipe`
- Socket：`/var/run/docker.sock`

**这个设计哲学的好处：**
- 统一的接口：所有操作都可以用open/read/write/close完成
- 简化编程：不需要为不同类型的资源学习不同的API
- 管道操作：可以方便地组合命令

### 1.3 inode：理解Linux文件系统的核心

**什么是inode？**

每个文件在Linux中都有一个唯一的inode号，存储了文件的元数据信息，但不包括文件名。

```
目录项(dentry)          inode                数据块
┌──────────┐        ┌──────────┐         ┌─────────┐
│ 文件名    │────→   │ inode号  │    ──→  │ 文件数据 │
│ 指向inode│        │ 权限     │         └─────────┘
└──────────┘        │ 大小     │
                    │ 所有者    │
                    │ 时间戳    │
                    │ 数据块指针│
                    └──────────┘
```

**inode包含的信息：**
- 文件大小
- 文件所有者（UID）
- 文件所属组（GID）
- 文件权限（读、写、执行）
- 时间戳（创建、修改、访问）
- 数据块的位置

**查看inode信息：**
```bash
# 查看文件inode号
ls -i test.txt
# 输出：123456 test.txt

# 查看详细inode信息
stat test.txt
# 输出：
#   File: test.txt
#   Size: 1024       Blocks: 8          IO Block: 4096   regular file
# Device: 8,1    Inode: 123456     Links: 1
# Access: (0644/-rw-r--r--)  Uid: ( 1000/   user)   Gid: ( 1000/   user)
# Access: 2025-01-01 12:00:00.000000000 +0800
# Modify: 2025-01-01 12:00:00.000000000 +0800
# Change: 2025-01-01 12:00:00.000000000 +0800
```

**inode的实际应用：**
```cpp
// 硬链接：两个文件名指向同一个inode
// 创建硬链接
ln source.txt hardlink.txt

// 删除原文件后，硬链接仍然可以访问数据
rm source.txt
cat hardlink.txt  // 仍然可以读取内容！

// 软链接：创建一个新的文件，指向原文件路径
ln -s source.txt softlink.txt

// 删除原文件后，软链接失效
rm source.txt
cat softlink.txt  // 错误：No such file or directory
```

### 1.4 文件权限深度解析

**权限表示方法：**

```
-rwxr-xr--  1 user group  1024 Jan 1 12:00 file.txt

├─ 文件类型：- 普通文件, d 目录, l 链接
├─ 所有者权限：rwx (读、写、执行)
├─ 组权限：r-x (读、执行)
└─ 其他用户权限：r-- (只读)
```

**权限数字表示：**

| 权限 | 数字 | 说明 |
|------|------|------|
| r | 4 | 读权限 |
| w | 2 | 写权限 |
| x | 1 | 执行权限 |
| - | 0 | 无权限 |

**常用权限组合：**
- 755 = rwxr-xr-x（所有者完全权限，其他人可读执行）
- 644 = rw-r--r--（所有者可读写，其他人只读）
- 777 = rwxrwxrwx（所有人完全权限，慎用！）
- 600 = rw-------（只有所有者可读写）

**修改权限：**
```bash
chmod 755 script.sh    # 设置权限为755
chmod +x program       # 添加执行权限
chmod u+w file         # 给所有者添加写权限
chmod g-r file         # 移除组的读权限
```

### 1.5 硬链接 vs 软链接

| 特性 | 硬链接 | 软链接（符号链接） |
|------|--------|-------------------|
| inode | 与原文件相同 | 独立的inode |
| 跨文件系统 | 不支持 | 支持 |
| 目录链接 | 不支持 | 支持 |
| 原文件删除 | 仍然有效 | 失效 |
| 创建命令 | `ln source target` | `ln -s source target` |

---

## 二、文件操作（C语言API）

### 2.1 打开和关闭文件

```cpp
#include <iostream>
#include <fcntl.h>      // open函数
#include <unistd.h>     // read, write, close
#include <cstring>

int main() {
    // 打开文件
    // O_RDONLY: 只读, O_WRONLY: 只写, O_RDWR: 读写
    // O_CREAT: 不存在则创建, O_TRUNC: 清空文件
    int fd = open("test.txt", O_RDWR | O_CREAT | O_TRUNC, 0644);
    
    if (fd == -1) {
        std::cerr << "打开文件失败" << std::endl;
        return 1;
    }
    
    // 写入数据
    const char* message = "Hello, Linux File System!";
    write(fd, message, strlen(message));
    
    // 移动文件指针到开头
    lseek(fd, 0, SEEK_SET);
    
    // 读取数据
    char buffer[100];
    int bytesRead = read(fd, buffer, sizeof(buffer));
    buffer[bytesRead] = '\0';  // 添加字符串结束符
    
    std::cout << "读取内容: " << buffer << std::endl;
    
    // 关闭文件
    close(fd);
    
    return 0;
}
```

**open函数的标志位详解：**

| 标志位 | 说明 |
|--------|------|
| O_RDONLY | 只读模式 |
| O_WRONLY | 只写模式 |
| O_RDWR | 读写模式 |
| O_CREAT | 文件不存在时创建 |
| O_EXCL | 与O_CREAT一起使用，确保创建新文件 |
| O_TRUNC | 如果文件存在，清空内容 |
| O_APPEND | 追加模式 |
| O_NONBLOCK | 非阻塞模式 |

### 2.2 文件属性操作

```cpp
#include <iostream>
#include <sys/stat.h>
#include <unistd.h>

int main() {
    struct stat fileInfo;
    
    // 获取文件信息
    if (stat("test.txt", &fileInfo) == 0) {
        std::cout << "文件大小: " << fileInfo.st_size << " 字节" << std::endl;
        std::cout << "文件权限: " << (fileInfo.st_mode & 0777) << std::endl;
        std::cout << "inode号: " << fileInfo.st_ino << std::endl;
        
        // 判断文件类型
        if (S_ISREG(fileInfo.st_mode)) {
            std::cout << "这是一个普通文件" << std::endl;
        } else if (S_ISDIR(fileInfo.st_mode)) {
            std::cout << "这是一个目录" << std::endl;
        }
    }
    
    return 0;
}
```

### 2.3 目录操作

```cpp
#include <iostream>
#include <dirent.h>
#include <cstring>

// 列出目录内容
void listDirectory(const char* path) {
    DIR* dir = opendir(path);
    
    if (dir == nullptr) {
        std::cerr << "无法打开目录: " << path << std::endl;
        return;
    }
    
    struct dirent* entry;
    std::cout << "目录 " << path << " 的内容:" << std::endl;
    
    while ((entry = readdir(dir)) != nullptr) {
        // 跳过 . 和 ..
        if (strcmp(entry->d_name, ".") == 0 || 
            strcmp(entry->d_name, "..") == 0) {
            continue;
        }
        std::cout << "  " << entry->d_name << std::endl;
    }
    
    closedir(dir);
}

int main() {
    listDirectory(".");      // 当前目录
    listDirectory("/home");  // /home目录
    
    return 0;
}
```

---

## 三、设备管理

### 3.1 设备文件

Linux通过设备文件访问硬件设备：

```
/dev/sda      ← 第一块硬盘
/dev/sda1     ← 第一块硬盘的第一个分区
/dev/tty      ← 终端设备
/dev/null     ← 空设备（黑洞）
/dev/zero     ← 零设备（无限0）
/dev/random   ← 随机数生成器
```

### 3.2 读写设备示例

```cpp
#include <iostream>
#include <fcntl.h>
#include <unistd.h>

int main() {
    // 从 /dev/urandom 读取随机数
    int fd = open("/dev/urandom", O_RDONLY);
    
    if (fd == -1) {
        std::cerr << "打开设备失败" << std::endl;
        return 1;
    }
    
    unsigned char randomBytes[4];
    read(fd, randomBytes, sizeof(randomBytes));
    
    std::cout << "随机数: ";
    for (int i = 0; i < 4; i++) {
        std::cout << (int)randomBytes[i] << " ";
    }
    std::cout << std::endl;
    
    close(fd);
    
    // 写入 /dev/null（数据会被丢弃）
    fd = open("/dev/null", O_WRONLY);
    write(fd, "这段文字会被丢弃", 20);
    close(fd);
    
    return 0;
}
```

### 3.3 串口通信示例

```cpp
#include <iostream>
#include <fcntl.h>
#include <unistd.h>
#include <termios.h>
#include <cstring>

int openSerialPort(const char* port) {
    // 打开串口设备
    int fd = open(port, O_RDWR | O_NOCTTY | O_SYNC);
    
    if (fd == -1) {
        std::cerr << "无法打开串口: " << port << std::endl;
        return -1;
    }
    
    // 配置串口参数
    struct termios tty;
    memset(&tty, 0, sizeof(tty));
    
    if (tcgetattr(fd, &tty) != 0) {
        std::cerr << "获取串口属性失败" << std::endl;
        close(fd);
        return -1;
    }
    
    // 设置波特率 9600
    cfsetospeed(&tty, B9600);
    cfsetispeed(&tty, B9600);
    
    // 8位数据位，无校验，1位止位
    tty.c_cflag = (tty.c_cflag & ~CSIZE) | CS8;
    tty.c_cflag &= ~PARENB;
    tty.c_cflag &= ~CSTOPB;
    
    // 应用配置
    tcsetattr(fd, TCSANOW, &tty);
    
    return fd;
}

int main() {
    int fd = openSerialPort("/dev/ttyUSB0");
    
    if (fd >= 0) {
        // 发送数据
        const char* data = "AT\r\n";
        write(fd, data, strlen(data));
        
        // 接收数据
        char buffer[256];
        int n = read(fd, buffer, sizeof(buffer));
        
        if (n > 0) {
            std::cout << "收到: " << buffer << std::endl;
        }
        
        close(fd);
    }
    
    return 0;
}
```

---

## 四、Linux内存管理

### 4.1 内存布局

每个进程的内存空间布局：

```
高地址
┌─────────────────┐
│   内核空间       │  ← 操作系统使用（用户不可访问）
├─────────────────┤
│   栈 (Stack)    │  ← 局部变量、函数调用（向下增长）
│        ↓        │
│                 │
│        ↑        │
│   堆 (Heap)     │  ← 动态分配（malloc/new）（向上增长）
├─────────────────┤
│   BSS段         │  ← 未初始化的全局变量
├─────────────────┤
│   数据段 (Data) │  ← 已初始化的全局变量、静态变量
├─────────────────┤
│   代码段 (Text) │  ← 程序代码（只读）
└─────────────────┘
低地址
```

### 4.2 虚拟内存

Linux使用虚拟内存技术：
- 每个进程认为自己拥有完整的内存空间
- 实际物理内存由操作系统管理
- 不常用的内存页会被交换到磁盘（swap）

```
进程A的虚拟地址空间          物理内存
┌──────────────┐           ┌──────────┐
│  0x00001000  │──映射──→  │ 物理页1  │
│  0x00002000  │──映射──→  │ 物理页5  │
│  0x00003000  │──未映射──→│ (在磁盘) │
└──────────────┘           └──────────┘

进程B的虚拟地址空间
┌──────────────┐
│  0x00001000  │──映射──→  物理页1（共享！）
│  0x00002000  │──映射──→  物理页8
└──────────────┘
```

### 4.3 内存分配方式

```cpp
#include <iostream>
#include <cstdlib>
#include <cstring>

int main() {
    // 方式1：栈分配（自动管理）
    int stackVar = 100;
    char stackArray[100];
    
    // 方式2：堆分配（手动管理）
    int* heapVar = (int*)malloc(sizeof(int));
    *heapVar = 200;
    
    char* heapArray = (char*)malloc(100);
    strcpy(heapArray, "Hello");
    
    // 方式3：C++ new/delete
    int* cppVar = new int(300);
    int* cppArray = new int[10];
    
    std::cout << "栈变量: " << stackVar << std::endl;
    std::cout << "堆变量: " << *heapVar << std::endl;
    std::cout << "C++变量: " << *cppVar << std::endl;
    
    // 释放内存（很重要！）
    free(heapVar);
    free(heapArray);
    delete cppVar;
    delete[] cppArray;
    
    return 0;
}
```

### 4.4 查看进程内存

```bash
# 查看进程内存使用
ps aux | grep your_program

# 查看内存映射
cat /proc/<pid>/maps

# 实时查看内存
top
htop

# 查看系统内存
free -h
```

### 4.5 内存映射（mmap）

mmap可以将文件映射到内存，实现高效文件读写：

```cpp
#include <iostream>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/stat.h>

int main() {
    // 打开文件
    int fd = open("test.txt", O_RDWR);
    
    if (fd == -1) {
        std::cerr << "打开文件失败" << std::endl;
        return 1;
    }
    
    // 获取文件大小
    struct stat fileInfo;
    fstat(fd, &fileInfo);
    size_t fileSize = fileInfo.st_size;
    
    // 将文件映射到内存
    char* mapped = (char*)mmap(nullptr, fileSize, 
                                PROT_READ | PROT_WRITE,
                                MAP_SHARED, fd, 0);
    
    if (mapped == MAP_FAILED) {
        std::cerr << "映射失败" << std::endl;
        close(fd);
        return 1;
    }
    
    // 直接像操作内存一样操作文件
    std::cout << "文件内容: " << mapped << std::endl;
    
    // 修改内容
    mapped[0] = 'H';
    mapped[1] = 'i';
    
    // 同步到磁盘
    msync(mapped, fileSize, MS_SYNC);
    
    // 解除映射
    munmap(mapped, fileSize);
    close(fd);
    
    return 0;
}
```

---

## 五、内存泄漏检测

### 5.1 常见内存错误

```cpp
// 错误1：内存泄漏（忘记释放）
void leakExample() {
    int* p = new int(100);
    // 忘记 delete p
}

// 错误2：野指针（使用已释放的内存）
void danglingPointer() {
    int* p = new int(100);
    delete p;
    *p = 200;  // 错误！p已经无效
}

// 错误3：重复释放
void doubleFree() {
    int* p = new int(100);
    delete p;
    delete p;  // 错误！重复释放
}
```

### 5.2 使用Valgrind检测

```bash
# 安装Valgrind
sudo apt install valgrind

# 运行检测
valgrind --leak-check=full ./your_program

# 输出示例：
# ==12345== HEAP SUMMARY:
# ==12345==     in use at exit: 4 bytes in 1 blocks
# ==12345==   total heap usage: 1 allocs, 0 frees, 4 bytes allocated
# ==12345== 
# ==12345== 4 bytes in 1 blocks are definitely lost
# ==12345==    at 0x4C2DB8F: operator new(unsigned long)
# ==12345==    by 0x1091A3: main (test.cpp:5)
```

---

## 六、实践练习

### 练习1：文件复制程序
实现一个程序，复制一个文件到另一个位置。

### 练习2：目录遍历
递归遍历一个目录，列出所有文件和子目录。

### 练习3：简易日志系统
实现一个日志系统，将日志写入文件，支持按大小分割。

### 练习4：内存池实现
实现一个简单的内存池，减少频繁malloc/free的开销。

---

## 七、常用命令速查

```bash
# 文件操作
ls -la           # 列出文件
cp src dest      # 复制
mv src dest      # 移动/重命名
rm file          # 删除
chmod 755 file   # 修改权限
chown user file  # 修改所有者

# 进程查看
ps aux           # 查看所有进程
top              # 实时进程监控
kill -9 <pid>    # 强制结束进程

# 内存查看
free -h          # 查看内存
vmstat           # 虚拟内存统计

# 磁盘查看
df -h            # 磁盘使用
du -sh *         # 目录大小
```

---

## 八、学习资源

- B站视频：https://www.bilibili.com/video/BV1cT411F7cC

---

## 九、Linux与Qt开发的对应关系（重点！）

### 9.1 Linux文件操作 → Qt文件操作

理解Linux文件操作后，在Qt中使用文件就变得非常容易：

| Linux API | Qt对应类 | 说明 |
|-----------|---------|------|
| open/close | QFile | 文件打开关闭 |
| read/write | QFile::read/write | 文件读写 |
| lseek | QFile::seek | 文件指针定位 |
| stat | QFileInfo | 文件信息获取 |
| opendir/readdir | QDir | 目录操作 |
| mmap | QFile::map | 内存映射 |

#### Qt文件操作完整示例

```cpp
#include <QFile>
#include <QTextStream>
#include <QDataStream>
#include <QDebug>
#include <QFileInfo>
#include <QDir>

class FileManager {
public:
    // 1. 文本文件读写
    static void textFileOperations() {
        // 写入文本文件
        QFile writeFile("test.txt");
        if (writeFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
            QTextStream out(&writeFile);
            out.setCodec("UTF-8");  // 设置编码
            out << "Hello, Qt!" << endl;
            out << "这是第二行" << endl;
            writeFile.close();
        }
        
        // 读取文本文件
        QFile readFile("test.txt");
        if (readFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
            QTextStream in(&readFile);
            in.setCodec("UTF-8");
            
            // 逐行读取
            while (!in.atEnd()) {
                QString line = in.readLine();
                qDebug() << "读取行:" << line;
            }
            
            // 或者一次性读取全部
            // readFile.seek(0);  // 重置指针
            // QString allContent = in.readAll();
            
            readFile.close();
        }
    }
    
    // 2. 二进制文件读写
    static void binaryFileOperations() {
        // 写入二进制数据
        QFile writeFile("data.bin");
        if (writeFile.open(QIODevice::WriteOnly)) {
            QDataStream out(&writeFile);
            out.setVersion(QDataStream::Qt_5_15);
            
            // 写入各种类型数据
            out << QString("Hello");
            out << (qint32)42;
            out << (qdouble)3.14159;
            
            writeFile.close();
        }
        
        // 读取二进制数据
        QFile readFile("data.bin");
        if (readFile.open(QIODevice::ReadOnly)) {
            QDataStream in(&readFile);
            in.setVersion(QDataStream::Qt_5_15);
            
            QString str;
            qint32 num;
            qdouble pi;
            
            in >> str >> num >> pi;
            
            qDebug() << "字符串:" << str;
            qDebug() << "整数:" << num;
            qDebug() << "浮点数:" << pi;
            
            readFile.close();
        }
    }
    
    // 3. 使用QFile直接读写（对应Linux的read/write）
    static void rawFileOperations() {
        QFile file("raw.bin");
        if (file.open(QIODevice::WriteOnly)) {
            const char* data = "Hello Binary";
            file.write(data, strlen(data));
            file.close();
        }
        
        if (file.open(QIODevice::ReadOnly)) {
            QByteArray data = file.readAll();
            qDebug() << "原始数据:" << data;
            file.close();
        }
    }
};
```

#### Qt文件信息获取（对应Linux stat）

```cpp
#include <QFileInfo>
#include <QDebug>
#include <QDateTime>

void getFileInformation(const QString& filePath) {
    QFileInfo fileInfo(filePath);
    
    if (!fileInfo.exists()) {
        qDebug() << "文件不存在";
        return;
    }
    
    qDebug() << "文件名:" << fileInfo.fileName();
    qDebug() << "完整路径:" << fileInfo.absoluteFilePath();
    qDebug() << "文件大小:" << fileInfo.size() << "字节";
    qDebug() << "是否是文件:" << fileInfo.isFile();
    qDebug() << "是否是目录:" << fileInfo.isDir();
    qDebug() << "是否是符号链接:" << fileInfo.isSymLink();
    qDebug() << "创建时间:" << fileInfo.birthTime().toString();
    qDebug() << "修改时间:" << fileInfo.lastModified().toString();
    qDebug() << "访问时间:" << fileInfo.lastRead().toString();
    qDebug() << "权限-可读:" << fileInfo.isReadable();
    qDebug() << "权限-可写:" << fileInfo.isWritable();
    qDebug() << "权限-可执行:" << fileInfo.isExecutable();
    qDebug() << "所有者:" << fileInfo.owner();
    qDebug() << "所属组:" << fileInfo.group();
}
```

### 9.2 Linux目录操作 → Qt目录操作

| Linux API | Qt对应类 | 说明 |
|-----------|---------|------|
| opendir | QDir | 打开目录 |
| readdir | QDir::entryList | 列出目录内容 |
| mkdir | QDir::mkdir | 创建目录 |
| rmdir | QDir::rmdir | 删除目录 |
| chdir | QDir::setCurrent | 改变当前目录 |
| getcwd | QDir::currentPath | 获取当前目录 |

#### Qt目录操作完整示例

```cpp
#include <QDir>
#include <QDebug>
#include <QFileInfoList>

class DirectoryManager {
public:
    // 1. 列出目录内容
    static void listDirectory(const QString& path) {
        QDir dir(path);
        
        if (!dir.exists()) {
            qDebug() << "目录不存在:" << path;
            return;
        }
        
        // 列出所有文件和目录
        QFileInfoList entries = dir.entryInfoList(
            QDir::NoDotAndDotDot | QDir::AllEntries);
        
        for (const QFileInfo& entry : entries) {
            QString type = entry.isDir() ? "[目录]" : "[文件]";
            qDebug() << type << entry.fileName() 
                     << "(" << entry.size() << "字节)";
        }
    }
    
    // 2. 过滤文件
    static void filterFiles(const QString& path) {
        QDir dir(path);
        
        // 只列出.cpp文件
        QStringList cppFiles = dir.entryList(
            QStringList() << "*.cpp", 
            QDir::Files);
        
        qDebug() << "C++文件:";
        for (const QString& file : cppFiles) {
            qDebug() << "  " << file;
        }
    }
    
    // 3. 递归遍历目录
    static void recursiveList(const QString& path, int indent = 0) {
        QDir dir(path);
        QString prefix(indent * 2, ' ');
        
        QFileInfoList entries = dir.entryInfoList(
            QDir::NoDotAndDotDot | QDir::AllEntries);
        
        for (const QFileInfo& entry : entries) {
            qDebug() << prefix << entry.fileName();
            
            if (entry.isDir()) {
                recursiveList(entry.absoluteFilePath(), indent + 1);
            }
        }
    }
    
    // 4. 创建和删除目录
    static void directoryOperations() {
        QDir dir;
        
        // 创建目录
        if (dir.mkdir("new_folder")) {
            qDebug() << "目录创建成功";
        }
        
        // 创建多级目录
        if (dir.mkpath("a/b/c")) {
            qDebug() << "多级目录创建成功";
        }
        
        // 删除空目录
        if (dir.rmdir("new_folder")) {
            qDebug() << "目录删除成功";
        }
        
        // 删除目录及其内容
        if (dir.removeRecursively()) {
            qDebug() << "目录及内容删除成功";
        }
    }
};
```

### 9.3 Linux内存管理 → Qt内存管理

Qt提供了更高级的内存管理机制：

#### Qt智能指针和对象树

```cpp
#include <QObject>
#include <QScopedPointer>
#include <QSharedPointer>
#include <QDebug>

class QtMemoryManagement {
public:
    // 1. Qt对象树（自动内存管理）
    static void objectTreeExample() {
        // 父对象删除时，自动删除子对象
        QObject* parent = new QObject;
        QObject* child1 = new QObject(parent);
        QObject* child2 = new QObject(parent);
        
        delete parent;  // child1和child2自动被删除！
    }
    
    // 2. QScopedPointer（类似std::unique_ptr）
    static void scopedPointerExample() {
        QScopedPointer<int> ptr(new int(42));
        qDebug() << "值:" << *ptr;
        // 离开作用域自动删除
    }
    
    // 3. QSharedPointer（类似std::shared_ptr）
    static void sharedPointerExample() {
        QSharedPointer<int> ptr1(new int(42));
        QSharedPointer<int> ptr2 = ptr1;  // 引用计数+1
        
        qDebug() << "引用计数:" << ptr1.refCount();  // 2
    }
};
```

#### Qt内存泄漏检测

```cpp
// 使用Qt内存泄漏检测工具
// 1. 启用内存泄漏检测
#ifdef QT_DEBUG
    #include <QDebug>
    // Qt会自动检测某些内存问题
#endif

// 2. 使用Valgrind（与Linux相同）
// valgrind --leak-check=full ./your_qt_app
```

### 9.4 Linux设备操作 → Qt串口通信

| Linux API | Qt对应类 | 说明 |
|-----------|---------|------|
| open("/dev/ttyUSB0") | QSerialPort | 串口操作 |
| termios配置 | QSerialPort::setBaudRate等 | 串口配置 |
| read/write | QSerialPort::read/write | 串口读写 |

#### Qt串口通信示例

```cpp
#include <QSerialPort>
#include <QDebug>

class SerialCommunication {
public:
    static void serialExample() {
        QSerialPort serial;
        serial.setPortName("/dev/ttyUSB0");
        serial.setBaudRate(QSerialPort::Baud9600);
        serial.setDataBits(QSerialPort::Data8);
        serial.setParity(QSerialPort::NoParity);
        serial.setStopBits(QSerialPort::OneStop);
        
        if (serial.open(QIODevice::ReadWrite)) {
            qDebug() << "串口打开成功";
            
            // 发送数据
            serial.write("AT\r\n");
            serial.waitForBytesWritten(1000);
            
            // 接收数据
            if (serial.waitForReadyRead(1000)) {
                QByteArray data = serial.readAll();
                qDebug() << "收到:" << data;
            }
            
            serial.close();
        }
    }
};
```

### 9.5 实际Qt项目中的应用场景

#### 场景1：配置文件管理

```cpp
#include <QSettings>
#include <QDir>

class ConfigManager {
private:
    QSettings settings;
    
public:
    ConfigManager() {
        // 配置文件路径
        QString configPath = QDir::homePath() + "/.myapp/config.ini";
        
        // 确保目录存在
        QDir().mkpath(QFileInfo(configPath).absolutePath());
        
        settings.setFileName(configPath);
        settings.setIniCodec("UTF-8");
    }
    
    void saveSetting(const QString& key, const QVariant& value) {
        settings.setValue(key, value);
    }
    
    QVariant loadSetting(const QString& key, const QVariant& defaultValue = QVariant()) {
        return settings.value(key, defaultValue);
    }
};
```

#### 场景2：日志文件管理

```cpp
#include <QFile>
#include <QTextStream>
#include <QDateTime>
#include <QMutex>

class LogManager {
private:
    QFile logFile;
    QTextStream logStream;
    QMutex mutex;
    
public:
    LogManager(const QString& logPath) {
        logFile.setFileName(logPath);
        logFile.open(QIODevice::WriteOnly | QIODevice::Append | QIODevice::Text);
        logStream.setDevice(&logFile);
        logStream.setCodec("UTF-8");
    }
    
    void log(const QString& level, const QString& message) {
        QMutexLocker locker(&mutex);
        
        QString timestamp = QDateTime::currentDateTime()
            .toString("yyyy-MM-dd hh:mm:ss");
        
        logStream << QString("[%1] [%2] %3\n")
            .arg(timestamp).arg(level).arg(message);
        logStream.flush();
    }
    
    void info(const QString& msg) { log("INFO", msg); }
    void warn(const QString& msg) { log("WARN", msg); }
    void error(const QString& msg) { log("ERROR", msg); }
};
```

---

## 十、实践练习

### 练习1：文件复制程序
实现一个程序，复制一个文件到另一个位置。

### 练习2：目录遍历
递归遍历一个目录，列出所有文件和子目录。

### 练习3：简易日志系统
实现一个日志系统，将日志写入文件，支持按大小分割。

### 练习4：内存池实现
实现一个简单的内存池，减少频繁malloc/free的开销。

### 练习5：Qt文件浏览器
使用QDir和QFileInfo实现一个简单的文件浏览器，支持：
- 目录导航
- 文件类型过滤
- 文件大小显示
- 文件权限显示

### 练习6：Qt串口通信工具
使用QSerialPort实现一个串口调试助手，支持：
- 串口配置（波特率、数据位、校验位）
- 数据发送和接收
- HEX模式显示

---

## 十一、常用命令速查

```bash
# 文件操作
ls -la           # 列出文件
cp src dest      # 复制
mv src dest      # 移动/重命名
rm file          # 删除
chmod 755 file   # 修改权限
chown user file  # 修改所有者

# 进程查看
ps aux           # 查看所有进程
top              # 实时进程监控
kill -9 <pid>    # 强制结束进程

# 内存查看
free -h          # 查看内存
vmstat           # 虚拟内存统计

# 磁盘查看
df -h            # 磁盘使用
du -sh *         # 目录大小
```

---

## 十二、学习资源

- B站视频：https://www.bilibili.com/video/BV1cT411F7cC
- Qt官方文档：https://doc.qt.io/qt-5/qfile.html
- Qt串口文档：https://doc.qt.io/qt-5/qserialport.html

---

## 十三、常见面试题与解答

### 1. Linux文件权限 rwx 各代表什么？

**答：**
- r（读）= 4：可以读取文件内容或列出目录内容
- w（写）= 2：可以修改文件内容或在目录中创建/删除文件
- x（执行）= 1：可以执行文件（程序）或进入目录

### 2. 硬链接和软链接的区别？

**答：**
- 硬链接：与原文件共享同一个inode，删除原文件不影响硬链接
- 软链接：独立的文件，存储的是原文件的路径，删除原文件后软链接失效

### 3. 什么是虚拟内存？有什么作用？

**答：**
- 虚拟内存让每个进程认为自己拥有完整的内存空间
- 作用：隔离进程、支持超过物理内存的程序、内存共享、内存映射文件

### 4. malloc和new的区别？

**答：**
- malloc是C函数，new是C++运算符
- malloc只分配内存，new还会调用构造函数
- malloc返回void*需要类型转换，new返回类型安全的指针
- malloc/free配对，new/delete配对

### 5. 什么是内存泄漏？如何检测？

**答：**
- 内存泄漏：分配的内存没有被释放，导致内存逐渐耗尽
- 检测工具：Valgrind、AddressSanitizer、Qt Creator内存分析器

### 6. mmap的作用和使用场景？

**答：**
- mmap将文件映射到内存，可以直接通过指针访问文件内容
- 使用场景：大文件高效读写、进程间共享内存、内存数据库
