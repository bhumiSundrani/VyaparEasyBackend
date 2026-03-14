import axios from 'axios';
import { env } from '../config/env';

export const sendSMS = async (phone: string, message: string) => {
  try {
    const response = await axios.get(
      'https://www.fast2sms.com/dev/bulkV2', // or your actual API endpoint
      {params: {
        authorization: env.FAST2SMS_API_KEY_SMS as string,
        route: 'q',
        message: message,
        flash: 0,
        numbers: phone.replace('+91', '') // FastSMS expects 10-digit numbers
      },}
    )

    if (response.data.return) {
      console.log('SMS sent successfully');
    } else {
      console.log('SMS send failed:', response.data.message);
    }

    return response.data;
  } catch (error: any) {
    console.error('Error sending SMS:', error.response?.data || error.message);
    throw new Error('SMS sending failed');
  }
};
