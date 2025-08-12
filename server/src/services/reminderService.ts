import cron from 'node-cron';

export function startReminderService() {
  // 每分钟检查一次提醒
  cron.schedule('* * * * *', () => {
    // 这里将来实现提醒逻辑
    // console.log('检查提醒...');
  });

  console.log('提醒服务已启动');
}