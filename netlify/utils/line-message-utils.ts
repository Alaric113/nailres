
export const statusStyles: Record<string, {
  headerColor: string;
  titleText: string;
  statusText: string;
  statusTextColor: string;
  themeColor: string;
}> = {
  pending_payment: {
    headerColor: '#F5F3EF', // Soft cream
    titleText: '等待訂金支付',
    statusText: '待付訂金',
    statusTextColor: '#B45309', // Amber 700
    themeColor: '#D97706', // Amber 600
  },
  pending_confirmation: {
    headerColor: '#F5F3EF', // Soft cream
    titleText: '等待確認',
    statusText: '待確認',
    statusTextColor: '#B45309', // Amber 700
    themeColor: '#D97706', // Amber 600
  },
  confirmed: {
    headerColor: '#F0F2F0', // Soft Greenish
    titleText: '預約成功',
    statusText: '已確認',
    statusTextColor: '#9F9586', // Brand Olive
    themeColor: '#9F9586',
  },
  completed: {
    headerColor: '#F3F4F6', // Gray
    titleText: '服務完成',
    statusText: '已完成',
    statusTextColor: '#1159bdff',
    themeColor: '#6B7280',
  },
  cancelled: {
    headerColor: '#FEF2F2', // Red fade
    titleText: '預約已取消',
    statusText: '已取消',
    statusTextColor: '#DC2626',
    themeColor: '#EF4444',
  },
  default: {
    headerColor: '#F3F4F6',
    titleText: '預約資訊',
    statusText: '狀態未知',
    statusTextColor: '#6B7280',
    themeColor: '#9CA3AF',
  },
};

export const createBookingConfirmationFlex = (
  customerName: string,
  serviceNames: string[],
  formattedDateTime: string,
  amount: number,
  status: string,
  bookingId: string,
  liffId?: string // Optional, pass process.env.VITE_LIFF_ID usually
) => {
  const style = statusStyles[status] || statusStyles.default;
  const liffBase = liffId ? `https://liff.line.me/${liffId}` : 'https://liff.line.me/YOUR_LIFF_ID';

  let actionData: any = {
    label: '查看詳細資訊',
    uri: `${liffBase}/orders/${bookingId}`
  };

  if (status === 'pending_payment') {
    actionData = {
      label: '我已付款?', // Go to Payment
      uri: `${liffBase}/booking/pay/${bookingId}`
    };
  }

  const footerContents: any[] = [
    {
      type: 'button',
      action: {
        type: 'uri',
        label: actionData.label,
        uri: actionData.uri
      },
      style: 'primary',
      color: status === 'pending_payment' ? '#B45309' : '#9F9586', // Amber for payment, Brand color for others
      height: 'sm'
    }
  ];

  if (status === 'completed') {
    footerContents.unshift({
      type: 'button',
      action: {
        type: 'uri',
        label: '給予評價',
        uri: `${liffBase}/orders/${bookingId}/feedback`
      },
      style: 'primary',
      color: '#9F9586',
      height: 'sm',
      margin: 'md'
    });
  }

  return {
    type: 'bubble',
    size: 'mega', // Maximized width
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: style.titleText,
              weight: 'bold',
              size: 'xl',
              color: style.themeColor,
              flex: 1
            },
            {
              type: 'text',
              text: style.statusText,
              weight: 'bold',
              size: 'sm',
              color: style.statusTextColor,
              align: 'end',
              gravity: 'center'
            }
          ]
        },
        {
          type: 'separator',
          margin: 'md',
          color: style.themeColor
        }
      ],
      backgroundColor: '#FFFFFF',
      paddingTop: '20px',
      paddingBottom: '10px',
      paddingStart: '20px',
      paddingEnd: '20px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `Hi, ${customerName}`,
          weight: 'bold',
          size: 'md',
          margin: 'md',
          color: '#1F2937'
        },
        {
          type: 'text',
          text: status === 'completed' ? '感謝您的光臨，期待再次為您服務！' : '感謝您的預約，以下是您的詳細資訊：',
          size: 'xs',
          color: '#6B7280',
          margin: 'sm',
          wrap: true
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'xl',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '服務項目', color: '#9CA3AF', size: 'xs', flex: 2 },
                { type: 'text', text: serviceNames.join('、'), wrap: true, color: '#374151', size: 'sm', flex: 5, weight: 'bold' }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '預約時間', color: '#9CA3AF', size: 'xs', flex: 2 },
                { type: 'text', text: formattedDateTime, wrap: true, color: '#374151', size: 'sm', flex: 5 }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                { type: 'text', text: '金額合計', color: '#9CA3AF', size: 'xs', flex: 2 },
                { type: 'text', text: `NT$ ${amount}`, wrap: true, color: '#9F9586', size: 'lg', flex: 5, weight: 'bold' }
              ]
            }
          ]
        }
      ],
      backgroundColor: '#FFFFFF'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        ...footerContents,
        {
          type: 'text',
          text: status === 'completed' ? '如有任何問題，歡迎隨時聯繫我們。' : '如需更改或取消，請提前聯繫我們。',
          size: 'xxs',
          color: '#9CA3AF',
          align: 'center',
          margin: 'md',
          wrap: true
        }
      ],
      paddingAll: '20px'
    },
    styles: {
      footer: {
        separator: false
      }
    }
  };
};

export const createSeasonPassFlexMessage = (
  customerName: string,
  passName: string,
  variantName: string,
  price: number,
  bankInfo: any,
  settings: any
) => {
  const { headerText = '季卡訂單成立', headerColor = '#9F9586', bodyTextTemplate = '', footerText = '' } = settings;

  // Replace variables in template
  let bodyText = bodyTextTemplate
    .replace('{{customerName}}', customerName)
    .replace('{{passName}}', passName)
    .replace('{{variantName}}', variantName)
    .replace('{{price}}', price.toLocaleString());

  // Handle bankInfo specially
  const bankInfoText = `${bankInfo.bankCode} ${bankInfo.bankName}\n${bankInfo.accountNumber}\n${bankInfo.accountName}`;
  bodyText = bodyText.replace('{{bankInfo}}', bankInfoText);

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: headerText,
          weight: 'bold',
          size: 'xl',
          color: '#FFFFFF',
          align: 'center'
        }
      ],
      backgroundColor: headerColor,
      paddingAll: '20px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: bodyText,
          wrap: true,
          size: 'sm',
          color: '#666666',
          lineSpacing: '4px'
        }
      ],
      paddingAll: '20px',
      backgroundColor: '#FFFFFF'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'separator',
          color: '#EFEFEF'
        },
        {
          type: 'text',
          text: footerText,
          size: 'xs',
          color: '#AAAAAA',
          align: 'center',
          margin: 'md',
          wrap: true
        }
      ],
      backgroundColor: '#FFFFFF',
      paddingAll: '10px'
    }
  };
};
