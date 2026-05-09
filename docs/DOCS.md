    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
}
```

### 2. Not handling notifications in the foreground

**Problem**: Notifications are not visible when the app is in the foreground.

**Solution**: By default, notifications are not shown when the app is in the foreground. To change this, you need to set a notification handler.

```tsx
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
```

## Common Patterns

### 1. Task reminder scheduled from a due date

This pattern shows how to schedule a reminder relative to a task's due date (e.g. 30 minutes before).

```ts
import * as Notifications from 'expo-notifications';

export async function scheduleTaskReminder(task: {
  id: string;
  title: string;
  dueDate: Date;
}) {
  const triggerDate = new Date(task.dueDate);
  triggerDate.setMinutes(triggerDate.getMinutes() - 30);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task due soon',
      body: task.title,
      data: { taskId: task.id },
    },
    trigger: { type: 'date', date: triggerDate },
  });
}
```

### 1. Scheduling a recurring notification

This pattern shows how to schedule a notification that repeats every day at 9 AM.

```tsx
async function scheduleDailyNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning!',
      body: 'Check out the latest news in your feed.',
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}
```
