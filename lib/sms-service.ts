// Service d'envoi de SMS gratuit pour validation d'inscription
export interface SMSConfig {
  enabled: boolean
  provider: "free" | "twilio" | "africastalking"
  apiKey?: string
  senderId?: string
}

export const smsConfig: SMSConfig = {
  enabled: true,
  provider: "free", // Service GRATUIT pour le développement et test
  apiKey: process.env.AFRICASTALKING_API_KEY, // Gardé pour future migration
  senderId: process.env.SMS_SENDER_ID || "BANKASS"
}

// Fonction pour générer un code de validation à 6 chiffres
export function generateValidationCode(length: number = 6): string {
  const chars = "0123456789"
  let code = ""
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Fonction pour générer un mot de passe sécurisé
export function generateSecurePassword(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Fonction pour valider un numéro de téléphone malien
export function validateMalianPhone(phone: string): boolean {
  // Nettoyer le numéro
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
  
  // Accepter tous les formats maliens
  // Format +223
  if (cleanPhone.startsWith('+223')) {
    return cleanPhone.length === 12 && /^\+223[0-9]{8}$/.test(cleanPhone)
  }
  
  // Format 223 (sans +)
  if (cleanPhone.startsWith('223')) {
    return cleanPhone.length === 11 && /^223[0-9]{8}$/.test(cleanPhone)
  }
  
  // Format 0 (local)
  if (cleanPhone.startsWith('0')) {
    return cleanPhone.length === 9 && /^0[0-9]{8}$/.test(cleanPhone)
  }
  
  // Format 8 chiffres (sans préfixe)
  if (cleanPhone.length === 8 && /^[0-9]{8}$/.test(cleanPhone)) {
    return true
  }
  
  return false
}

// Fonction pour normaliser le numéro de téléphone
export function normalizePhone(phone: string): string {
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '')
  
  // Ajouter +223 si nécessaire
  if (cleanPhone.startsWith('+223')) {
    return cleanPhone
  } else if (cleanPhone.startsWith('223')) {
    return '+' + cleanPhone
  } else if (cleanPhone.startsWith('0')) {
    return '+223' + cleanPhone.substring(1)
  } else if (cleanPhone.length === 8) {
    return '+223' + cleanPhone
  }
  
  return cleanPhone
}

// Service d'envoi de SMS (simulation pour le moment)
export class SMSService {
  private static instance: SMSService
  private validationCodes: Map<string, { code: string; timestamp: number; attempts: number }> = new Map()
  
  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService()
    }
    return SMSService.instance
  }
  
  async sendValidationCode(phone: string): Promise<{ success: boolean; message: string; code?: string }> {
    if (!smsConfig.enabled) {
      return { success: false, message: "Service SMS désactivé" }
    }
    
    const normalizedPhone = normalizePhone(phone)
    
    if (!validateMalianPhone(normalizedPhone)) {
      return { success: false, message: "Numéro de téléphone malien invalide" }
    }
    
    try {
      // Générer un code de validation
      const code = generateValidationCode(6)
      const timestamp = Date.now()
      
      // Stocker le code avec timestamp
      this.validationCodes.set(normalizedPhone, { 
        code, 
        timestamp, 
        attempts: 0 
      })
      
      // ENVOI SMS RÉEL - Africa's Talking
      const smsSent = await this.sendRealSMS(normalizedPhone, `BANKASS AWARDS - Votre code de validation est: ${code}`)
      
      if (!smsSent) {
        return { success: false, message: "Erreur lors de l'envoi du SMS" }
      }
      
      console.log(`✅ SMS envoyé à ${normalizedPhone}: Code ${code}`)
      
      return { 
        success: true, 
        message: `Code de validation envoyé au ${normalizedPhone}`,
        code // Retourner le code pour le développement
      }
      
    } catch (error) {
      console.error("Erreur envoi SMS:", error)
      return { 
        success: false, 
        message: "Erreur lors de l'envoi du SMS" 
      }
    }
  }
  
  validateCode(phone: string, inputCode: string): { success: boolean; message: string } {
    const normalizedPhone = normalizePhone(phone)
    const stored = this.validationCodes.get(normalizedPhone)
    
    if (!stored) {
      return { success: false, message: "Aucun code envoyé pour ce numéro" }
    }
    
    // Vérifier si le code a expiré (15 minutes)
    const now = Date.now()
    const fifteenMinutes = 15 * 60 * 1000
    if (now - stored.timestamp > fifteenMinutes) {
      this.validationCodes.delete(normalizedPhone)
      return { success: false, message: "Code expiré. Veuillez demander un nouveau code" }
    }
    
    // Vérifier le nombre de tentatives (max 3)
    if (stored.attempts >= 3) {
      this.validationCodes.delete(normalizedPhone)
      return { success: false, message: "Trop de tentatives. Veuillez demander un nouveau code" }
    }
    
    // Incrémenter les tentatives
    stored.attempts++
    
    // Vérifier le code
    if (stored.code === inputCode) {
      this.validationCodes.delete(normalizedPhone)
      return { success: true, message: "Code validé avec succès" }
    } else {
      const remainingAttempts = 3 - stored.attempts
      return { 
        success: false, 
        message: `Code incorrect. ${remainingAttempts} tentative(s) restante(s)` 
      }
    }
  }
  
  async sendPassword(phone: string, password: string): Promise<{ success: boolean; message: string }> {
    if (!smsConfig.enabled) {
      return { success: false, message: "Service SMS désactivé" }
    }
    
    const normalizedPhone = normalizePhone(phone)
    
    if (!validateMalianPhone(normalizedPhone)) {
      return { success: false, message: "Numéro de téléphone malien invalide" }
    }
    
    try {
      // ENVOI SMS RÉEL - Africa's Talking
      const smsSent = await this.sendRealSMS(normalizedPhone, `Bienvenue sur BANKASS AWARDS! Votre mot de passe est: ${password}`)
      
      if (!smsSent) {
        return { success: false, message: "Erreur lors de l'envoi du SMS" }
      }
      
      console.log(`✅ Mot de passe envoyé à ${normalizedPhone}`)
      
      return { 
        success: true, 
        message: `Mot de passe envoyé au ${normalizedPhone}` 
      }
      
    } catch (error) {
      console.error("Erreur envoi SMS:", error)
      return { 
        success: false, 
        message: "Erreur lors de l'envoi du SMS" 
      }
    }
  }
  
  // Méthode pour envoyer des SMS réels via Africa's Talking
  private async sendRealSMS(phone: string, message: string): Promise<boolean> {
    if (smsConfig.provider === "free") {
      // Mode simulation pour le développement
      console.log(`📱 SIMULATION SMS à ${phone}:`)
      console.log(`Message: ${message}`)
      return true
    }
    
    if (!smsConfig.apiKey || smsConfig.apiKey === "YOUR_AFRICASTALKING_API_KEY") {
      console.error("❌ Clé API Africa's Talking non configurée")
      return false
    }
    
    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'apiKey': smsConfig.apiKey
        },
        body: new URLSearchParams({
          username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
          to: phone,
          message: message,
          from: smsConfig.senderId || 'BANKASS'
        })
      })
      
      const result = await response.json()
      
      if (result.SMSMessageData && result.SMSMessageData.Recipients) {
        const recipient = result.SMSMessageData.Recipients[0]
        if (recipient.status === "Success") {
          console.log(`✅ SMS envoyé avec succès à ${phone}, MessageId: ${recipient.messageId}`)
          return true
        } else {
          console.error(`❌ Échec envoi SMS à ${phone}: ${recipient.status}`)
          return false
        }
      } else {
        console.error("❌ Réponse API invalide:", result)
        return false
      }
    } catch (error) {
      console.error("❌ Erreur API Africa's Talking:", error)
      return false
    }
  }
  
  // Vérifier si un code a déjà été envoyé récemment (pour éviter le spam)
  canSendNewCode(phone: string): boolean {
    const normalizedPhone = normalizePhone(phone)
    const stored = this.validationCodes.get(normalizedPhone)
    
    if (!stored) {
      return true
    }
    
    // Attendre 60 secondes entre les envois
    const now = Date.now()
    const sixtySeconds = 60 * 1000
    return (now - stored.timestamp) > sixtySeconds
  }
}

// Fonction pour vérifier si un téléphone existe déjà
export function checkPhoneExists(phone: string, users: any[]): boolean {
  const normalizedPhone = normalizePhone(phone)
  return users.some(user => 
    user.phone && normalizePhone(user.phone) === normalizedPhone
  )
}

// Configuration simplifiée pour l'inscription
export const SIMPLE_SECURITY_CONFIG = {
  // Champs obligatoires simplifiés
  requiredFields: {
    fullName: true,
    phone: true, // Téléphone au lieu d'email
    domain: true,
    city: true
  },
  
  // Validation simplifiée
  phoneValidation: true,
  codeValidation: true, // Valider avec code SMS
  passwordGeneration: true, // Générer automatiquement le mot de passe
  smsVerification: true, // Envoyer par SMS
  
  // Messages
  messages: {
    phoneRequired: "Le numéro de téléphone est obligatoire",
    phoneInvalid: "Numéro de téléphone malien invalide (formats acceptés: +223 XX XX XX XX, 223XXXXXXXX, 0XXXXXXXX, ou XXXXXXXX)",
    phoneExists: "Ce numéro de téléphone est déjà utilisé",
    codeSent: "Code de validation envoyé par SMS",
    codeInvalid: "Code de validation incorrect",
    codeExpired: "Code de validation expiré",
    passwordSent: "Mot de passe envoyé par SMS",
    signupSuccess: "Inscription réussie ! Vérifiez vos SMS pour le mot de passe."
  }
}
