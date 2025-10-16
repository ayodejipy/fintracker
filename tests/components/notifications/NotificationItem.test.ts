import type { Notification } from '~/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import NotificationItem from '~/components/notifications/NotificationItem.vue'

// Mock the composable
vi.mock('~/composables/useNotifications', () => ({
  useNotifications: () => ({
    getNotificationIcon: vi.fn(() => 'i-heroicons-bell'),
    getNotificationColor: vi.fn(() => 'blue'),
    formatNotificationTime: vi.fn(() => '5m ago'),
  }),
}))

const mockNotification: Notification = {
  id: '1',
  userId: 'user1',
  type: 'budget_alert',
  title: 'Budget Alert',
  message: 'You have exceeded your budget',
  isRead: false,
  priority: 'high',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  budgetId: 'budget1',
}

describe('notificationItem', () => {
  it('renders notification correctly', () => {
    const wrapper = mount(NotificationItem, {
      props: {
        notification: mockNotification,
      },
    })

    expect(wrapper.text()).toContain('Budget Alert')
    expect(wrapper.text()).toContain('You have exceeded your budget')
    expect(wrapper.text()).toContain('5m ago')
  })

  it('shows unread indicator for unread notifications', () => {
    const wrapper = mount(NotificationItem, {
      props: {
        notification: mockNotification,
      },
    })

    // Should show unread indicator (blue dot)
    expect(wrapper.find('.bg-blue-600').exists()).toBe(true)
  })

  it('does not show unread indicator for read notifications', () => {
    const readNotification = { ...mockNotification, isRead: true }
    const wrapper = mount(NotificationItem, {
      props: {
        notification: readNotification,
      },
    })

    // Should not show unread indicator
    expect(wrapper.find('.bg-blue-600').exists()).toBe(false)
  })

  it('shows mark as read button for unread notifications', () => {
    const wrapper = mount(NotificationItem, {
      props: {
        notification: mockNotification,
        showActions: true,
      },
    })

    expect(wrapper.text()).toContain('Mark as read')
  })

  it('does not show mark as read button for read notifications', () => {
    const readNotification = { ...mockNotification, isRead: true }
    const wrapper = mount(NotificationItem, {
      props: {
        notification: readNotification,
        showActions: true,
      },
    })

    expect(wrapper.text()).not.toContain('Mark as read')
  })

  it('emits read event when mark as read is clicked', async () => {
    const wrapper = mount(NotificationItem, {
      props: {
        notification: mockNotification,
        showActions: true,
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('read')).toBeTruthy()
    expect(wrapper.emitted('read')?.[0]).toEqual([mockNotification])
  })

  it('emits click event when notification is clicked', async () => {
    const wrapper = mount(NotificationItem, {
      props: {
        notification: mockNotification,
      },
    })

    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockNotification])
  })

  it('applies correct priority classes', () => {
    const highPriorityNotification = { ...mockNotification, priority: 'high' as const }
    const wrapper = mount(NotificationItem, {
      props: {
        notification: highPriorityNotification,
      },
    })

    // Should have red border for high priority
    expect(wrapper.find('.border-l-red-500').exists()).toBe(true)
  })

  it('applies opacity for read notifications', () => {
    const readNotification = { ...mockNotification, isRead: true }
    const wrapper = mount(NotificationItem, {
      props: {
        notification: readNotification,
      },
    })

    expect(wrapper.find('.opacity-60').exists()).toBe(true)
  })
})
