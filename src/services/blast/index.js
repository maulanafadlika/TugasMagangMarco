const { BlastModel } = require("../../models");
const { ResponseHandler, DateFormatter, createLog, sendEmail, sendWhatsAppMessage } = require("../../utils");

const Blast = new BlastModel;

class BlastService {
  static async provideBlast() {
    try {
      let datas = await Blast.getAllBlast();
    
      // Use map to handle async operations  
      datas?.map(async (item) => {
        const userData = await Blast.findUserData(item.created_by);
        
        if (userData) {
          // Send email
          const now = Date.now();
          const duedate = new Date(item.duedate).getTime();
          const threeDaysBefore = duedate - (3 * 24 * 60 * 60 * 1000);
          let messageToAssignedUser = "";
          if (userData.email !== null) {
            if (now >= threeDaysBefore && now < duedate && item.status !== 'todo') {
              const subject = `Reminding payment from Project ${item.project_name} with PO Number : ${item.po_number}`;
              messageToAssignedUser = `
                <b>Dear ${userData.name},</b><br><br>Reminder for status payment ${item.status} - due date : <b>${item.duedate}</b> from Project <b>${item.project_name} and PO Number ${item.po_number}</b><br><br>
              `;
              const responseSendEmail = await sendEmail({ subject, email: userData.email, message: messageToAssignedUser });
              console.log(`[INFO]: Status-code sending email to ${userData.email}: ${responseSendEmail.statusCode}`);
              console.log(`[INFO]: Data response from sending email to ${userData.email}: ${responseSendEmail.data}`);
            } else if(item.status === 'todo') {
              const subject = `Reminding payment from Project ${item.project_name} with PO Number : ${item.po_number}`;
              messageToAssignedUser = `
                <b>Dear ${userData.name},</b><br><br>Reminder for status payment ${item.status} - due date : <b>${item.duedate}</b> from Project <b>${item.project_name} and PO Number ${item.po_number}</b><br><br>
              `;
              const responseSendEmail = await sendEmail({ subject, email: userData.email, message: messageToAssignedUser });
              console.log(`[INFO]: Status-code sending email to ${userData.email}: ${responseSendEmail.statusCode}`);
              console.log(`[INFO]: Data response from sending email to ${userData.email}: ${responseSendEmail.data}`);
            }
          }
          
          // Send WhatsApp message
          if (userData.phone_number !== null) {
            if (now >= threeDaysBefore && now < duedate && item.status === 'rescedule') {
              messageToAssignedUser = `
                *Dear ${userData.name},* Reminder payment from Project ${item.project_name} with PO Number : ${item.po_number}*`;
              const responseSendWhatsapp = await sendWhatsAppMessage({ message: messageToAssignedUser, phone: userData.phone_number });
              console.log(`[INFO]: Status-code sending whatsapp to ${userData.phone_number}: ${responseSendWhatsapp.statusCode}`);
              console.log(`[INFO]: Data response from sending whatsapp to ${userData.phone_number}: ${responseSendWhatsapp.data}`);
            } else if (item.status === 'todo') {
              messageToAssignedUser = `
                *Dear ${userData.name},* Reminder payment from Project ${item.project_name} with PO Number : ${item.po_number}*
              `;
              const responseSendWhatsapp = await sendWhatsAppMessage({ message: messageToAssignedUser, phone: userData.phone_number });
              console.log(`[INFO]: Status-code sending whatsapp to ${userData.phone_number}: ${responseSendWhatsapp.statusCode}`);
              console.log(`[INFO]: Data response from sending whatsapp to ${userData.phone_number}: ${responseSendWhatsapp.data}`);
            }
          }
        }
      });

      return true;
    } catch (error) {
      console.error('[ERROR]: Error in provideBlast:', error);
      throw error;
    }
  }
}

module.exports = BlastService;