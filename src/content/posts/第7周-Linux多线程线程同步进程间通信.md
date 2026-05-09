---
title: "Linux多线程、线程同步、进程间通信"
date: "2026-05-09"
excerpt: "本内容直接关联Qt开发：Qt的QThread、QMutex、QWaitCondition、QThreadPool等类都基于这些底层概念。"
cover_url: ""
tags: ["线程", "同步", "进程间通信"]
---
# Linux多线程、线程同步、进程间通信（详细版）

> 学习重点：线程创建、互斥锁、条件变量、线程池、线程安全、进程间通信
> 
> 本内容直接关联Qt开发：Qt的QThread、QMutex、QWaitCondition、QThreadPool等类都基于这些底层概念

---

## 目录

1. [线程的本质与底层原理](#一)
2. [线程创建的三种方式](#二)
3. [线程同步机制详解](#三)
4. [死锁问题深度剖析](#四)
5. [条件变量与生产者消费者](#五)
6. [线程池原理与实现](#六)
7. [进程间通信完整指南](#七)
8. [Qt中的多线程对应关系](#八)
9. [实战项目](#九)

---

## 一、线程的本质与底层原理

### 1.1 进程 vs 线程 - 深入理解

#### 进程的内部结构

一个进程在内存中由以下几个部分组成：

```
┌─────────────────────────────────────┐
│           进程地址空间               │
├─────────────────────────────────────┤
│  代码段 (Text Segment)              │  ← 程序指令（只读）
│  数据段 (Data Segment)              │  ← 已初始化的全局变量
│  BSS段                              │  ← 未初始化的全局变量
│  堆 (Heap)                          │  ← 动态分配的内存（malloc/new）
│  栈 (Stack)                         │  ← 局部变量、函数调用
│  内存映射区 (Memory Mapping)        │  ← 共享库、mmap
└─────────────────────────────────────┘
```

#### 线程共享什么？不共享什么？

```
进程
├── 共享的资源（所有线程共用）
│   ├── 代码段（程序指令）
│   ├── 数据段（全局变量）
│   ├── 堆（动态内存）
│   ├── 文件描述符表
│   ├── 信号处理程序
│   └── 当前工作目录
│
└── 每个线程独有的资源
    ├── 线程ID (TID)
    ├── 寄存器状态
    ├── 程序计数器 (PC)
    ├── 栈（Stack）← 最重要的独有资源！
    ├── 线程局部存储 (TLS)
    └── 信号掩码
```

**关键理解：为什么线程需要自己的栈？**

```cpp
void functionA() {
    int x = 10;        // x存储在调用线程的栈上
    functionB();
}

void functionB() {
    int y = 20;        // y也存储在调用线程的栈上
}

// 如果两个线程同时调用functionA：
// 线程1的栈：x=10 → functionB → y=20
// 线程2的栈：x=10 → functionB → y=20
// 互不干扰！因为每个线程有自己的栈空间
```

### 1.2 线程切换的开销

线程切换不是免费的，操作系统需要做以下工作：

```
线程A → 线程B 切换过程：
1. 保存线程A的寄存器状态到内核栈
2. 保存线程A的程序计数器
3. 更新内存管理单元(MMU)的TLB缓存
4. 加载线程B的寄存器状态
5. 加载线程B的程序计数器
6. 恢复执行线程B

每次切换大约需要几微秒到几十微秒
```

**性能影响：**
- 线程太少：CPU利用率低
- 线程太多：切换开销大，反而变慢
- 最佳线程数：通常 = CPU核心数 × 2

### 1.3 用户态线程 vs 内核态线程

```
用户态线程（协程）：
── 由程序自己调度
├── 切换开销极小（纳秒级）
├── 不能利用多核
└── 例子：Go的goroutine、Python的asyncio

内核态线程（pthread）：
├── 由操作系统调度
── 切换开销较大（微秒级）
├── 可以利用多核
── 例子：pthread、std::thread
```

---

## 二、线程创建的三种方式

### 2.1 方式一：pthread（C语言API）

#### 完整示例：传递复杂参数

```cpp
#include <iostream>
#include <pthread.h>
#include <unistd.h>
#include <vector>
#include <string>

// 定义线程参数结构体
struct ThreadTask {
    int taskId;
    std::string taskName;
    std::vector<int> data;
    int* result;  // 用于返回结果
};

// 线程函数
void* processTask(void* arg) {
    ThreadTask* task = static_cast<ThreadTask*>(arg);
    
    std::cout << "[线程] 开始处理任务 " << task->taskId 
              << ": " << task->taskName << std::endl;
    
    // 模拟处理数据
    int sum = 0;
    for (int num : task->data) {
        sum += num;
        usleep(100000);  // 模拟耗时操作（100ms）
    }
    
    // 返回结果
    *(task->result) = sum;
    
    std::cout << "[线程] 任务 " << task->taskId << " 完成，结果: " << sum << std::endl;
    
    return nullptr;
}

int main() {
    const int NUM_THREADS = 4;
    pthread_t threads[NUM_THREADS];
    ThreadTask tasks[NUM_THREADS];
    int results[NUM_THREADS] = {0};
    
    // 创建任务
    for (int i = 0; i < NUM_THREADS; i++) {
        tasks[i].taskId = i + 1;
        tasks[i].taskName = "数据处理任务";
        tasks[i].data = {i*10+1, i*10+2, i*10+3, i*10+4, i*10+5};
        tasks[i].result = &results[i];
        
        // 创建线程
        int ret = pthread_create(&threads[i], nullptr, processTask, &tasks[i]);
        if (ret != 0) {
            std::cerr << "创建线程失败: " << ret << std::endl;
            return 1;
        }
    }
    
    std::cout << "[主线程] 所有线程已创建，等待完成..." << std::endl;
    
    // 等待所有线程完成
    for (int i = 0; i < NUM_THREADS; i++) {
        pthread_join(threads[i], nullptr);
    }
    
    // 汇总结果
    int totalSum = 0;
    for (int i = 0; i < NUM_THREADS; i++) {
        std::cout << "任务" << (i+1) << "结果: " << results[i] << std::endl;
        totalSum += results[i];
    }
    std::cout << "总和: " << totalSum << std::endl;
    
    return 0;
}
```

#### pthread常用函数详解

```cpp
// 1. 创建线程
int pthread_create(pthread_t* thread,           // 线程ID（输出）
                   const pthread_attr_t* attr,   // 线程属性（通常nullptr）
                   void* (*start_routine)(void*), // 线程函数
                   void* arg);                    // 传递给线程函数的参数

// 2. 等待线程结束
int pthread_join(pthread_t thread,    // 要等待的线程ID
                 void** retval);       // 线程返回值（可nullptr）

// 3. 线程分离（不需要join）
int pthread_detach(pthread_t thread);

// 4. 获取当前线程ID
pthread_t pthread_self(void);

// 5. 比较两个线程ID
int pthread_equal(pthread_t t1, pthread_t t2);

// 6. 线程退出
void pthread_exit(void* retval);

// 7. 取消线程
int pthread_cancel(pthread_t thread);
```

### 2.2 方式二：C++11 std::thread

```cpp
#include <iostream>
#include <thread>
#include <vector>
#include <functional>

// 方式1：普通函数
void printNumbers(int start, int end) {
    for (int i = start; i <= end; i++) {
        std::cout << std::this_thread::get_id() << ": " << i << std::endl;
    }
}

// 方式2：Lambda表达式
auto lambdaTask = [](int n) {
    std::cout << "Lambda处理: " << n << std::endl;
};

// 方式3：类成员函数
class TaskProcessor {
public:
    void process(int id) {
        std::cout << "对象方法处理任务: " << id << std::endl;
    }
};

int main() {
    // 创建线程 - 各种方式
    std::thread t1(printNumbers, 1, 5);
    std::thread t2(lambdaTask, 42);
    
    TaskProcessor processor;
    std::thread t3(&TaskProcessor::process, &processor, 100);
    
    // 等待所有线程
    t1.join();
    t2.join();
    t3.join();
    
    return 0;
}
```

### 2.3 方式三：Qt的QThread（与Qt开发直接相关）

```cpp
#include <QThread>
#include <QDebug>
#include <QObject>

// 方式1：继承QThread
class WorkerThread : public QThread {
    Q_OBJECT
protected:
    void run() override {
        // 这里就是线程执行的代码
        for (int i = 0; i < 5; i++) {
            qDebug() << "WorkerThread:" << i;
            msleep(500);  // 睡眠500ms
        }
    }
};

// 方式2：QObject + moveToThread（推荐！）
class Worker : public QObject {
    Q_OBJECT
public slots:
    void doWork() {
        for (int i = 0; i < 5; i++) {
            qDebug() << "Worker:" << i;
            QThread::msleep(500);
        }
        emit workFinished();
    }
signals:
    void workFinished();
};

// 使用方式2
void startWorker() {
    QThread* thread = new QThread;
    Worker* worker = new Worker;
    
    worker->moveToThread(thread);
    
    // 连接信号槽
    connect(thread, &QThread::started, worker, &Worker::doWork);
    connect(worker, &Worker::workFinished, thread, &QThread::quit);
    connect(thread, &QThread::finished, worker, &QObject::deleteLater);
    connect(thread, &QThread::finished, thread, &QObject::deleteLater);
    
    thread->start();
}
```

### 2.4 三种方式对比

| 特性 | pthread | std::thread | QThread |
|------|---------|-------------|---------|
| 语言 | C | C++11 | C++/Qt |
| 跨平台 | Linux为主 | 跨平台 | 跨平台 |
| 与GUI集成 | 无 | 无 | 完美集成 |
| 信号槽支持 | 无 | 无 | 支持 |
| 推荐场景 | 底层开发 | 普通C++项目 | Qt项目 |

---

## 三、线程同步机制详解

### 3.1 为什么需要同步？- 数据竞争深度分析

#### 问题演示：不加锁的计数器

```cpp
#include <iostream>
#include <thread>
#include <vector>

int counter = 0;

void increment() {
    for (int i = 0; i < 100000; i++) {
        counter++;  // 问题在这里！
    }
}

int main() {
    std::thread t1(increment);
    std::thread t2(increment);
    
    t1.join();
    t2.join();
    
    std::cout << "counter = " << counter << std::endl;
    // 期望：200000
    // 实际：可能是 100000~200000 之间的任意值！
    
    return 0;
}
```

#### 为什么 counter++ 不是原子操作？

`counter++` 在CPU层面实际分为三步：

```
线程A                          线程B
│                              │
│ 1. 读取 counter (值=100)     │
│                              │ 1. 读取 counter (值=100)
│ 2. 加1 (100+1=101)           │
│                              │ 2. 加1 (100+1=101)
│ 3. 写回 counter (值=101)     │
│                              │ 3. 写回 counter (值=101)
│                              │
│ 结果：counter = 101          │
│ 但期望：counter = 102        │
│ 因为两次增加只生效了一次！    │
```

这就是**数据竞争（Data Race）**：多个线程同时读写同一数据，且至少有一个是写操作。

### 3.2 互斥锁（Mutex）详解

#### 互斥锁的工作原理

```
互斥锁就像一个房间的钥匙：
- 只有一把钥匙
- 拿到钥匙的人可以进入房间
- 出来时必须归还钥匙
- 其他人必须等待钥匙归还

pthread_mutex_t / std::mutex 就是这把"钥匙"
```

#### pthread互斥锁完整示例

```cpp
#include <iostream>
#include <pthread.h>
#include <unistd.h>

class BankAccount {
private:
    int balance;
    pthread_mutex_t lock;
    
public:
    BankAccount(int initial) : balance(initial) {
        pthread_mutex_init(&lock, nullptr);
    }
    
    ~BankAccount() {
        pthread_mutex_destroy(&lock);
    }
    
    // 存款
    void deposit(int amount) {
        pthread_mutex_lock(&lock);  // 加锁
        
        int current = balance;
        // 模拟一些处理时间
        usleep(1000);
        balance = current + amount;
        
        std::cout << "存款 " << amount << ", 余额: " << balance << std::endl;
        
        pthread_mutex_unlock(&lock);  // 解锁
    }
    
    // 取款
    bool withdraw(int amount) {
        pthread_mutex_lock(&lock);  // 加锁
        
        if (balance >= amount) {
            int current = balance;
            usleep(1000);
            balance = current - amount;
            std::cout << "取款 " << amount << ", 余额: " << balance << std::endl;
            pthread_mutex_unlock(&lock);
            return true;
        }
        
        std::cout << "余额不足！当前: " << balance << std::endl;
        pthread_mutex_unlock(&lock);
        return false;
    }
    
    int getBalance() {
        pthread_mutex_lock(&lock);
        int b = balance;
        pthread_mutex_unlock(&lock);
        return b;
    }
};

// 模拟多个用户同时操作
void* userOperation(void* arg) {
    BankAccount* account = static_cast<BankAccount*>(arg);
    int userId = *static_cast<int*>(arg);
    
    account->deposit(100);
    account->withdraw(50);
    
    return nullptr;
}

int main() {
    BankAccount account(1000);
    pthread_t threads[10];
    int userIds[10];
    
    for (int i = 0; i < 10; i++) {
        userIds[i] = i + 1;
        pthread_create(&threads[i], nullptr, userOperation, &account);
    }
    
    for (int i = 0; i < 10; i++) {
        pthread_join(threads[i], nullptr);
    }
    
    std::cout << "最终余额: " << account.getBalance() << std::endl;
    
    return 0;
}
```

#### C++11 std::mutex 与 lock_guard

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>

class SafeCounter {
private:
    int count;
    mutable std::mutex mtx;  // mutable允许在const函数中加锁
    
public:
    SafeCounter() : count(0) {}
    
    void increment() {
        std::lock_guard<std::mutex> lock(mtx);  // 自动加锁
        count++;
        // 离开作用域自动解锁，即使发生异常也会解锁！
    }
    
    int getCount() const {
        std::lock_guard<std::mutex> lock(mtx);
        return count;
    }
};

int main() {
    SafeCounter counter;
    std::vector<std::thread> threads;
    
    // 创建10个线程，每个线程增加10000次
    for (int i = 0; i < 10; i++) {
        threads.emplace_back([&counter]() {
            for (int j = 0; j < 10000; j++) {
                counter.increment();
            }
        });
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    std::cout << "最终计数: " << counter.getCount() << std::endl;
    // 一定是 100000！
    
    return 0;
}
```

#### unique_lock vs lock_guard

```cpp
#include <mutex>

std::mutex mtx;

void example() {
    // lock_guard：简单场景，构造时加锁，析构时解锁
    {
        std::lock_guard<std::mutex> lock(mtx);
        // 做需要同步的操作
    }  // 离开作用域自动解锁
    
    // unique_lock：更灵活，可以手动控制
    {
        std::unique_lock<std::mutex> lock(mtx);
        // 做需要同步的操作
        
        lock.unlock();  // 可以手动解锁
        // 做不需要同步的操作
        
        lock.lock();    // 可以重新加锁
        // 继续做需要同步的操作
    }  // 离开作用域自动解锁（如果还锁着的话）
    
    // unique_lock 配合条件变量使用
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock);  // wait会自动解锁，唤醒时重新加锁
}
```

### 3.3 读写锁（Read-Write Lock）

#### 为什么需要读写锁？

互斥锁的问题：即使只是读数据，也要排队等待。

读写锁的优化：
- 多个读者可以同时读（不互斥）
- 写者独占（与读者和写者都互斥）

```cpp
#include <iostream>
#include <thread>
#include <shared_mutex>  // C++17
#include <vector>>
#include <chrono>>

class SharedData {
private:
    std::vector<int> data;
    mutable std::shared_mutex rwMutex;  // 读写锁
    
public:
    void writeData(int value) {
        std::unique_lock<std::shared_mutex> lock(rwMutex);  // 写锁（独占）
        data.push_back(value);
        std::cout << "写入: " << value << std::endl;
    }
    
    int readData(int index) const {
        std::shared_lock<std::shared_mutex> lock(rwMutex);  // 读锁（共享）
        if (index >= 0 && index < data.size()) {
            return data[index];
        }
        return -1;
    }
    
    size_t size() const {
        std::shared_lock<std::shared_mutex> lock(rwMutex);
        return data.size();
    }
};

int main() {
    SharedData sharedData;
    
    // 多个读线程可以同时读取
    auto reader = [&sharedData](int readerId) {
        for (int i = 0; i < 5; i++) {
            int value = sharedData.readData(i);
            std::cout << "读者" << readerId << "读取: " << value << std::endl;
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    };
    
    // 写线程独占访问
    auto writer = [&sharedData](int value) {
        sharedData.writeData(value);
    };
    
    std::thread r1(reader, 1);
    std::thread r2(reader, 2);
    std::thread w1(writer, 100);
    
    r1.join();
    r2.join();
    w1.join();
    
    return 0;
}
```

### 3.4 自旋锁（Spinlock）

#### 自旋锁 vs 互斥锁

```
互斥锁：
- 拿不到锁 → 线程睡眠 → 操作系统切换线程 → 等待唤醒
- 适合：锁持有时间较长的场景

自旋锁：
- 拿不到锁 → 循环检查 → 不睡眠
- 适合：锁持有时间极短的场景（避免切换开销）
```

```cpp
#include <atomic>
#include <thread>
#include <iostream>

class Spinlock {
private:
    std::atomic_flag flag = ATOMIC_FLAG_INIT;
    
public:
    void lock() {
        while (flag.test_and_set(std::memory_order_acquire)) {
            // 自旋等待（忙等待）
            // 可以加入pause指令减少功耗
        }
    }
    
    void unlock() {
        flag.clear(std::memory_order_release);
    }
};

int main() {
    Spinlock spinlock;
    int counter = 0;
    
    auto task = [&]() {
        for (int i = 0; i < 100000; i++) {
            spinlock.lock();
            counter++;
            spinlock.unlock();
        }
    };
    
    std::thread t1(task);
    std::thread t2(task);
    
    t1.join();
    t2.join();
    
    std::cout << "counter = " << counter << std::endl;
    
    return 0;
}
```

---

## 四、死锁问题深度剖析

### 4.1 什么是死锁？

死锁：两个或多个线程互相等待对方释放资源，导致所有线程都无法继续执行。

```
经典死锁场景：哲学家就餐问题

哲学家A        哲学家B
   │              │
   ├── 拿起左筷子 ─┤
   │              ├── 拿起左筷子
   ├── 等待右筷子 ─┤
   │              ├── 等待右筷子
   │              │
   死锁！两人都在等对方放下筷子
```

### 4.2 死锁的四个必要条件

```
1. 互斥条件：资源一次只能被一个线程使用
2. 占有并等待：线程占有资源的同时等待其他资源
3. 不可抢占：资源不能被强制从线程手中夺走
4. 循环等待：存在一个线程-资源的循环等待链

破坏任意一个条件即可避免死锁
```

### 4.3 死锁代码示例

```cpp
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mutexA;
std::mutex mutexB;

void thread1Func() {
    std::cout << "线程1: 等待mutexA..." << std::endl;
    std::lock_guard<std::mutex> lockA(mutexA);
    std::cout << "线程1: 获得mutexA，等待mutexB..." << std::endl;
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    std::lock_guard<std::mutex> lockB(mutexB);  // 这里会死锁！
    std::cout << "线程1: 获得mutexB" << std::endl;
}

void thread2Func() {
    std::cout << "线程2: 等待mutexB..." << std::endl;
    std::lock_guard<std::mutex> lockB(mutexB);
    std::cout << "线程2: 获得mutexB，等待mutexA..." << std::endl;
    
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    std::lock_guard<std::mutex> lockA(mutexA);  // 这里会死锁！
    std::cout << "线程2: 获得mutexA" << std::endl;
}

int main() {
    std::thread t1(thread1Func);
    std::thread t2(thread2Func);
    
    t1.join();
    t2.join();
    
    return 0;
}
```

### 4.4 死锁解决方案

#### 方案1：固定加锁顺序

```cpp
// 始终按照相同的顺序加锁
void thread1Func() {
    std::lock_guard<std::mutex> lockA(mutexA);  // 先A
    std::lock_guard<std::mutex> lockB(mutexB);  // 后B
}

void thread2Func() {
    std::lock_guard<std::mutex> lockA(mutexA);  // 先A
    std::lock_guard<std::mutex> lockB(mutexB);  // 后B
}
```

#### 方案2：使用 std::lock 同时加锁

```cpp
void thread1Func() {
    // 同时加锁，避免死锁
    std::lock(mutexA, mutexB);
    std::lock_guard<std::mutex> lockA(mutexA, std::adopt_lock);
    std::lock_guard<std::mutex> lockB(mutexB, std::adopt_lock);
    // 操作...
}
```

#### 方案3：使用 std::scoped_lock（C++17）

```cpp
void thread1Func() {
    std::scoped_lock lock(mutexA, mutexB);  // 自动避免死锁
    // 操作...
}
```

#### 方案4：尝试加锁（try_lock）

```cpp
void thread1Func() {
    while (true) {
        if (mutexA.try_lock()) {
            if (mutexB.try_lock()) {
                // 都拿到了，执行操作
                mutexB.unlock();
                mutexA.unlock();
                break;
            }
            mutexA.unlock();
        }
        std::this_thread::yield();  // 让出CPU
    }
}
```

---

## 五、条件变量与生产者消费者

### 5.1 条件变量原理

条件变量用于线程间的"通知"机制：

```
线程A（等待方）               线程B（通知方）
    │                            │
    ├── 加锁                     │
    ├── 检查条件                 │
    ├── 条件不满足               │
    ├── 等待（自动解锁+睡眠）     │
    │                            ├── 加锁
    │                            ├── 修改条件
    │                            ├── 通知
    │                            ├── 解锁
    │                            │
    ├── 被唤醒（重新加锁）        │
    ├── 再次检查条件              │
    ├── 条件满足，继续执行        │
    ├── 解锁                     │
```

### 5.2 完整的生产者-消费者实现

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <chrono>
#include <atomic>

template<typename T>
class ThreadSafeQueue {
private:
    std::queue<T> queue;
    mutable std::mutex mtx;
    std::condition_variable cv;
    bool stopped = false;
    
public:
    // 生产者：推入数据
    void push(T item) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            if (stopped) return;
            queue.push(std::move(item));
        }
        cv.notify_one();  // 通知一个等待的消费者
    }
    
    // 消费者：弹出数据（阻塞等待）
    bool pop(T& item) {
        std::unique_lock<std::mutex> lock(mtx);
        
        // 等待直到有数据或停止
        cv.wait(lock, [this] {
            return !queue.empty() || stopped;
        });
        
        if (stopped && queue.empty()) {
            return false;
        }
        
        item = std::move(queue.front());
        queue.pop();
        return true;
    }
    
    // 停止队列
    void stop() {
        {
            std::lock_guard<std::mutex> lock(mtx);
            stopped = true;
        }
        cv.notify_all();  // 唤醒所有等待的线程
    }
    
    size_t size() const {
        std::lock_guard<std::mutex> lock(mtx);
        return queue.size();
    }
};

// 使用示例
int main() {
    ThreadSafeQueue<int> taskQueue;
    std::atomic<int> totalProcessed{0};
    
    // 生产者线程
    std::thread producer([&taskQueue]() {
        for (int i = 1; i <= 20; i++) {
            std::cout << "生产任务: " << i << std::endl;
            taskQueue.push(i);
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
        }
        taskQueue.stop();  // 通知消费者结束
    });
    
    // 消费者线程1
    std::thread consumer1([&taskQueue, &totalProcessed]() {
        int task;
        while (taskQueue.pop(task)) {
            std::cout << "消费者1 处理任务: " << task << std::endl;
            totalProcessed++;
            std::this_thread::sleep_for(std::chrono::milliseconds(300));
        }
    });
    
    // 消费者线程2
    std::thread consumer2([&taskQueue, &totalProcessed]() {
        int task;
        while (taskQueue.pop(task)) {
            std::cout << "消费者2 处理任务: " << task << std::endl;
            totalProcessed++;
            std::this_thread::sleep_for(std::chrono::milliseconds(400));
        }
    });
    
    producer.join();
    consumer1.join();
    consumer2.join();
    
    std::cout << "总共处理: " << totalProcessed << " 个任务" << std::endl;
    
    return 0;
}
```

### 5.3 有界缓冲区（带容量限制）

```cpp
template<typename T>
class BoundedQueue {
private:
    std::queue<T> queue;
    size_t capacity;
    mutable std::mutex mtx;
    std::condition_variable notFull;   // 不满的条件
    std::condition_variable notEmpty;  // 不空的条件
    
public:
    BoundedQueue(size_t cap) : capacity(cap) {}
    
    void push(T item) {
        std::unique_lock<std::mutex> lock(mtx);
        
        // 等待直到有空间
        notFull.wait(lock, [this] {
            return queue.size() < capacity;
        });
        
        queue.push(std::move(item));
        notEmpty.notify_one();  // 通知消费者
    }
    
    T pop() {
        std::unique_lock<std::mutex> lock(mtx);
        
        // 等待直到有数据
        notEmpty.wait(lock, [this] {
            return !queue.empty();
        });
        
        T item = std::move(queue.front());
        queue.pop();
        notFull.notify_one();  // 通知生产者
        return item;
    }
};
```

---

## 六、线程池原理与实现

### 6.1 为什么需要线程池？

```
没有线程池的问题：
1. 频繁创建/销毁线程开销大
2. 线程数量不可控，可能耗尽系统资源
3. 任务调度不灵活

线程池的优势：
1. 线程复用，减少创建销毁开销
2. 控制并发数量
3. 任务队列缓冲
4. 统一管理线程生命周期
```

### 6.2 完整线程池实现

```cpp
#include <iostream>
#include <vector>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <future>
#include <atomic>

class ThreadPool {
public:
    explicit ThreadPool(size_t numThreads) : stop(false) {
        for (size_t i = 0; i < numThreads; ++i) {
            workers.emplace_back([this] {
                while (true) {
                    std::function<void()> task;
                    
                    {
                        std::unique_lock<std::mutex> lock(queueMutex);
                        
                        // 等待直到有任务或停止
                        condition.wait(lock, [this] {
                            return stop || !tasks.empty();
                        });
                        
                        if (stop && tasks.empty()) {
                            return;  // 线程退出
                        }
                        
                        task = std::move(tasks.front());
                        tasks.pop();
                    }
                    
                    // 执行任务（在锁外面执行）
                    task();
                }
            });
        }
    }
    
    // 提交任务并获取future
    template<class F, class... Args>
    auto submit(F&& f, Args&&... args) 
        -> std::future<typename std::invoke_result<F, Args...>::type> {
        
        using ReturnType = typename std::invoke_result<F, Args...>::type;
        
        auto taskPtr = std::make_shared<std::packaged_task<ReturnType()>>(
            std::bind(std::forward<F>(f), std::forward<Args>(args)...)
        );
        
        std::future<ReturnType> result = taskPtr->get_future();
        
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            
            if (stop) {
                throw std::runtime_error("线程池已停止");
            }
            
            tasks.emplace([taskPtr]() {
                (*taskPtr)();
            });
        }
        
        condition.notify_one();
        return result;
    }
    
    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            stop = true;
        }
        condition.notify_all();
        
        for (std::thread& worker : workers) {
            worker.join();
        }
    }
    
    // 获取线程池大小
    size_t size() const {
        return workers.size();
    }
    
    // 获取待处理任务数
    size_t pendingTasks() const {
        std::lock_guard<std::mutex> lock(queueMutex);
        return tasks.size();
    }
    
private:
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;
    mutable std::mutex queueMutex;
    std::condition_variable condition;
    bool stop;
};

// 使用示例
int main() {
    ThreadPool pool(4);  // 4个线程
    
    std::cout << "线程池大小: " << pool.size() << std::endl;
    
    // 提交普通任务
    pool.submit([]() {
        std::cout << "任务1 执行" << std::endl;
    });
    
    // 提交带返回值的任务
    auto result1 = pool.submit([](int a, int b) {
        return a + b;
    }, 10, 20);
    
    auto result2 = pool.submit([]() {
        std::this_thread::sleep_for(std::chrono::seconds(1));
        return 42;
    });
    
    // 获取结果
    std::cout << "10 + 20 = " << result1.get() << std::endl;
    std::cout << "延迟任务结果: " << result2.get() << std::endl;
    
    // 提交多个任务
    std::vector<std::future<int>> futures;
    for (int i = 0; i < 10; i++) {
        futures.push_back(pool.submit([i]() {
            std::cout << "任务 " << i << " 执行" << std::endl;
            return i * i;
        }));
    }
    
    // 收集结果
    for (auto& f : futures) {
        std::cout << "结果: " << f.get() << std::endl;
    }
    
    std::cout << "待处理任务: " << pool.pendingTasks() << std::endl;
    
    return 0;
}
```

### 6.3 Qt中的线程池

```cpp
#include <QThreadPool>
#include <QRunnable>
#include <QDebug>

// 定义可运行任务
class MyTask : public QRunnable {
public:
    void run() override {
        qDebug() << "任务在线程" << QThread::currentThreadId() << "中执行";
        // 执行耗时操作
        QThread::sleep(1);
        qDebug() << "任务完成";
    }
};

// 使用线程池
void useThreadPool() {
    QThreadPool* pool = QThreadPool::globalInstance();
    pool->setMaxThreadCount(4);
    
    // 提交任务
    for (int i = 0; i < 10; i++) {
        MyTask* task = new MyTask();
        task->setAutoDelete(true);  // 自动删除
        pool->start(task);
    }
    
    // 等待所有任务完成
    pool->waitForDone();
}
```

---

## 七、进程间通信完整指南

### 7.1 进程间通信方式对比

| 方式 | 速度 | 复杂度 | 适用场景 |
|------|------|--------|---------|
| 管道 | 中 | 低 | 父子进程通信 |
| FIFO | 中 | 低 | 无关进程通信 |
| 消息队列 | 中 | 中 | 结构化消息 |
| 共享内存 | 最快 | 高 | 大数据量 |
| 信号量 | - | 中 | 同步控制 |
| Socket | 慢 | 中 | 跨机器通信 |

### 7.2 匿名管道（Pipe）

```cpp
#include <iostream>
#include <unistd.h>
#include <sys/wait.h>
#include <cstring>

int main() {
    int pipefd[2];  // pipefd[0]=读端, pipefd[1]=写端
    
    if (pipe(pipefd) == -1) {
        perror("pipe");
        return 1;
    }
    
    pid_t pid = fork();
    
    if (pid == 0) {
        // 子进程：读取数据
        close(pipefd[1]);  // 关闭写端
        
        char buffer[256];
        ssize_t n = read(pipefd[0], buffer, sizeof(buffer));
        buffer[n] = '\0';
        
        std::cout << "子进程收到: " << buffer << std::endl;
        
        close(pipefd[0]);
        _exit(0);
    } else {
        // 父进程：写入数据
        close(pipefd[0]);  // 关闭读端
        
        const char* msg = "Hello from parent process!";
        write(pipefd[1], msg, strlen(msg));
        
        close(pipefd[1]);
        wait(nullptr);
    }
    
    return 0;
}
```

### 7.3 命名管道（FIFO）

```cpp
// writer.cpp - 写入端
#include <iostream>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>
#include <cstring>

int main() {
    const char* fifoPath = "/tmp/myfifo";
    
    // 创建FIFO
    mkfifo(fifoPath, 0666);
    
    // 打开FIFO（会阻塞直到有读取端打开）
    int fd = open(fifoPath, O_WRONLY);
    
    const char* msg = "Hello via FIFO!";
    write(fd, msg, strlen(msg));
    
    close(fd);
    
    // 清理
    unlink(fifoPath);
    
    return 0;
}

// reader.cpp - 读取端
#include <iostream>
#include <fcntl.h>
#include <unistd.h>
#include <sys/stat.h>

int main() {
    const char* fifoPath = "/tmp/myfifo";
    
    // 打开FIFO
    int fd = open(fifoPath, O_RDONLY);
    
    char buffer[256];
    ssize_t n = read(fd, buffer, sizeof(buffer));
    buffer[n] = '\0';
    
    std::cout << "收到: " << buffer << std::endl;
    
    close(fd);
    
    return 0;
}
```

### 7.4 共享内存（最快IPC）

```cpp
#include <iostream>
#include <sys/ipc.h>
#include <sys/shm.h>
#include <cstring>
#include <unistd.h>
#include <sys/wait.h>

#define SHM_SIZE 1024

int main() {
    // 创建共享内存段
    int shmid = shmget(IPC_PRIVATE, SHM_SIZE, IPC_CREAT | 0666);
    if (shmid == -1) {
        perror("shmget");
        return 1;
    }
    
    // 附加到进程地址空间
    char* shm = static_cast<char*>(shmat(shmid, nullptr, 0));
    if (shm == (char*)-1) {
        perror("shmat");
        return 1;
    }
    
    pid_t pid = fork();
    
    if (pid == 0) {
        // 子进程：写入
        strcpy(shm, "Hello from child via shared memory!");
        std::cout << "子进程写入完成" << std::endl;
        shmdt(shm);
        _exit(0);
    } else {
        // 父进程：读取
        wait(nullptr);
        std::cout << "父进程读取: " << shm << std::endl;
        
        // 分离和删除
        shmdt(shm);
        shmctl(shmid, IPC_RMID, nullptr);
    }
    
    return 0;
}
```

### 7.5 信号量（同步控制）

```cpp
#include <iostream>
#include <semaphore.h>
#include <thread>
#include <vector>

sem_t semaphore;  // 信号量
const int MAX_RESOURCES = 3;  // 最大资源数

void worker(int id) {
    std::cout << "线程" << id << " 等待资源..." << std::endl;
    
    // P操作：获取资源（信号量减1）
    sem_wait(&semaphore);
    
    std::cout << "线程" << id << " 获得资源，工作中..." << std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(2));
    
    std::cout << "线程" << id << " 释放资源" << std::endl;
    
    // V操作：释放资源（信号量加1）
    sem_post(&semaphore);
}

int main() {
    // 初始化信号量，初始值为3
    sem_init(&semaphore, 0, MAX_RESOURCES);
    
    std::vector<std::thread> threads;
    
    // 创建5个线程，但只有3个能同时获得资源
    for (int i = 0; i < 5; i++) {
        threads.emplace_back(worker, i + 1);
    }
    
    for (auto& t : threads) {
        t.join();
    }
    
    sem_destroy(&semaphore);
    
    return 0;
}
```

---

## 八、Qt中的多线程对应关系

### 8.1 Linux线程概念 → Qt类映射

| Linux概念 | Qt对应类 | 说明 |
|-----------|---------|------|
| pthread | QThread | 线程封装 |
| pthread_mutex_t | QMutex | 互斥锁 |
| pthread_cond_t | QWaitCondition | 条件变量 |
| 线程池 | QThreadPool | 线程池 |
| 读写锁 | QReadWriteLock | 读写锁 |
| 信号量 | QSemaphore | 信号量 |

### 8.2 Qt互斥锁示例

```cpp
#include <QMutex>
#include <QMutexLocker>

class SafeData {
private:
    QList<int> data;
    mutable QMutex mutex;
    
public:
    void addData(int value) {
        QMutexLocker locker(&mutex);  // 自动加锁解锁
        data.append(value);
    }
    
    QList<int> getData() const {
        QMutexLocker locker(&mutex);
        return data;
    }
};
```

### 8.3 Qt条件变量示例

```cpp
#include <QWaitCondition>
#include <QMutex>

class Buffer {
private:
    QByteArray buffer;
    QMutex mutex;
    QWaitCondition bufferNotEmpty;
    QWaitCondition bufferNotFull;
    const int MaxSize = 1024;
    
public:
    void write(const QByteArray& data) {
        mutex.lock();
        while (buffer.size() + data.size() > MaxSize) {
            bufferNotFull.wait(&mutex);  // 等待有空间
        }
        buffer.append(data);
        bufferNotEmpty.wakeAll();  // 通知读取方
        mutex.unlock();
    }
    
    QByteArray read() {
        mutex.lock();
        while (buffer.isEmpty()) {
            bufferNotEmpty.wait(&mutex);  // 等待有数据
        }
        QByteArray data = buffer;
        buffer.clear();
        bufferNotFull.wakeAll();  // 通知写入方
        mutex.unlock();
        return data;
    }
};
```

---

## 九、实战项目

### 项目1：多线程文件下载器

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>
#include <fstream>
#include <atomic>

class MultiThreadDownloader {
private:
    std::string url;
    std::string outputPath;
    int fileSize;
    int numThreads;
    std::atomic<int> downloadedBytes{0};
    std::mutex progressMutex;
    
public:
    MultiThreadDownloader(const std::string& url, 
                          const std::string& output,
                          int size, int threads)
        : url(url), outputPath(output), fileSize(size), numThreads(threads) {}
    
    void downloadChunk(int threadId, int start, int end) {
        std::cout << "线程" << threadId << " 下载 " 
                  << start << "-" << end << std::endl;
        
        // 模拟下载
        for (int i = start; i < end; i++) {
            // 实际这里应该是HTTP请求
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
            
            downloadedBytes++;
            
            // 打印进度
            if (downloadedBytes % 100 == 0) {
                std::lock_guard<std::mutex> lock(progressMutex);
                double progress = (double)downloadedBytes / fileSize * 100;
                std::cout << "\r进度: " << progress << "%" << std::flush;
            }
        }
    }
    
    void start() {
        std::vector<std::thread> threads;
        int chunkSize = fileSize / numThreads;
        
        for (int i = 0; i < numThreads; i++) {
            int start = i * chunkSize;
            int end = (i == numThreads - 1) ? fileSize : start + chunkSize;
            
            threads.emplace_back(&MultiThreadDownloader::downloadChunk, 
                                this, i + 1, start, end);
        }
        
        for (auto& t : threads) {
            t.join();
        }
        
        std::cout << "\n下载完成！" << std::endl;
    }
};

int main() {
    MultiThreadDownloader downloader(
        "http://example.com/file.zip",
        "file.zip",
        1000,  // 模拟文件大小
        4      // 4个线程
    );
    
    downloader.start();
    
    return 0;
}
```

### 项目2：线程安全的日志系统

```cpp
#include <iostream>
#include <fstream>
#include <thread>
#include <mutex>
#include <queue>
#include <condition_variable>
#include <string>
#include <chrono>
#include <ctime>

class Logger {
private:
    std::ofstream file;
    std::mutex mtx;
    std::queue<std::string> logQueue;
    std::condition_variable cv;
    bool running = true;
    std::thread workerThread;
    
    std::string getCurrentTime() {
        auto now = std::chrono::system_clock::now();
        auto time = std::chrono::system_clock::to_time_t(now);
        char buffer[100];
        strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", localtime(&time));
        return buffer;
    }
    
    void worker() {
        while (true) {
            std::unique_lock<std::mutex> lock(mtx);
            cv.wait(lock, [this] {
                return !logQueue.empty() || !running;
            });
            
            while (!logQueue.empty()) {
                file << logQueue.front() << std::endl;
                logQueue.pop();
            }
            file.flush();
            
            if (!running && logQueue.empty()) {
                break;
            }
        }
    }
    
public:
    Logger(const std::string& filename) {
        file.open(filename, std::ios::app);
        workerThread = std::thread(&Logger::worker, this);
    }
    
    void log(const std::string& level, const std::string& message) {
        std::string logEntry = "[" + getCurrentTime() + "] [" + level + "] " + message;
        
        {
            std::lock_guard<std::mutex> lock(mtx);
            logQueue.push(logEntry);
        }
        cv.notify_one();
        
        // 同时输出到控制台
        std::cout << logEntry << std::endl;
    }
    
    void info(const std::string& msg) { log("INFO", msg); }
    void warn(const std::string& msg) { log("WARN", msg); }
    void error(const std::string& msg) { log("ERROR", msg); }
    
    ~Logger() {
        {
            std::lock_guard<std::mutex> lock(mtx);
            running = false;
        }
        cv.notify_all();
        workerThread.join();
        file.close();
    }
};

int main() {
    Logger logger("app.log");
    
    logger.info("程序启动");
    
    std::thread t1([&logger]() {
        for (int i = 0; i < 5; i++) {
            logger.info("线程1 消息 " + std::to_string(i));
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    });
    
    std::thread t2([&logger]() {
        for (int i = 0; i < 5; i++) {
            logger.warn("线程2 警告 " + std::to_string(i));
            std::this_thread::sleep_for(std::chrono::milliseconds(150));
        }
    });
    
    t1.join();
    t2.join();
    
    logger.info("程序结束");
    
    return 0;
}
```

---

## 十、常见面试题与解答

### 1. 线程和进程的区别？

**答：**
- 进程是资源分配的基本单位，线程是CPU调度的基本单位
- 进程有独立的地址空间，线程共享进程的地址空间
- 进程切换开销大，线程切换开销小
- 进程间通信复杂，线程间通信简单（共享内存）

### 2. 什么是死锁？如何避免？

**答：**
死锁是多个线程互相等待对方释放资源。避免方法：
- 固定加锁顺序
- 使用try_lock
- 使用std::scoped_lock
- 设置超时机制

### 3. 互斥锁和自旋锁的区别？

**答：**
- 互斥锁：拿不到锁就睡眠，适合锁持有时间长的场景
- 自旋锁：拿不到锁就循环等待，适合锁持有时间极短的场景
- 自旋锁浪费CPU，但避免了上下文切换开销

### 4. 什么是线程安全？

**答：**
线程安全指多线程环境下，代码能正确执行，不会出现数据竞争、死锁等问题。实现方法：
- 使用互斥锁保护共享数据
- 使用原子操作
- 使用线程局部存储
- 避免共享状态

### 5. 进程间通信有哪些方式？

**答：**
- 管道（匿名/命名）
- 消息队列
- 共享内存（最快）
- 信号量
- Socket（可跨机器）

### 6. 什么是条件变量？为什么要配合互斥锁使用？

**答：**
条件变量用于线程间通知。必须配合互斥锁因为：
- wait()会原子地释放锁并睡眠
- 唤醒时会重新获取锁
- 防止竞态条件
