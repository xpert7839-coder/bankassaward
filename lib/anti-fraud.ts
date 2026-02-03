// Système anti-fraude avancé pour prévenir multiconnexion et multivote
import type { User } from "@/hooks/use-api-data"

export interface FraudDetection {
  riskScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  reasons: string[]
  allowed: boolean
  action?: string
}

export interface VoteRecord {
  userId: string
  candidateId: string
  timestamp: number
  ip?: string
  userAgent?: string
  phoneHash: string
}

export interface ConnectionRecord {
  userId: string
  timestamp: number
  ip?: string
  userAgent?: string
  phoneHash: string
  isActive: boolean
}

export interface FraudulentUser {
  userId: string
  ip?: string
  phoneHashes: string[]
  userAgent?: string
  blockedAt: number
  blockReason: string
  riskScore: number
  attempts: number
}

export interface VoteBlock {
  ip?: string
  phoneHash: string
  blockedUntil: number
  reason: string
  blockedBy: string
}

// Stockage en mémoire (en production, utiliser une base de données)
const voteRecords: Map<string, VoteRecord[]> = new Map()
const connectionRecords: Map<string, ConnectionRecord[]> = new Map()
const suspiciousUsers: Set<string> = new Set()
const blockedIPs: Set<string> = new Set()
const fraudulentUsers: Map<string, FraudulentUser> = new Map()
const voteBlocks: Map<string, VoteBlock> = new Map()
const deviceFingerprints: Map<string, string[]> = new Map() // IP -> user IDs

export class AntiFraudSystem {
  private static instance: AntiFraudSystem
  
  static getInstance(): AntiFraudSystem {
    if (!AntiFraudSystem.instance) {
      AntiFraudSystem.instance = new AntiFraudSystem()
    }
    return AntiFraudSystem.instance
  }

  // Générer un hash du numéro de téléphone pour la détection
  private hashPhone(phone: string): string {
    if (!phone) return ''
    // Hash simple pour la détection (en production, utiliser bcrypt ou argon2)
    return btoa(phone.replace(/\D/g, '')).slice(0, 16)
  }

  // Détecter les tentatives de fraude à l'inscription
  detectSignupFraud(userData: any, existingUsers: User[], ip?: string): FraudDetection {
    const reasons: string[] = []
    let riskScore = 0

    // 1. Vérifier les doublons de numéro de téléphone
    const phoneExists = existingUsers.some(user => 
      user.phone && this.normalizePhone(user.phone) === this.normalizePhone(userData.phone)
    )
    if (phoneExists) {
      riskScore += 50
      reasons.push("Numéro de téléphone déjà utilisé")
    }

    // 2. Vérifier les doublons de nom complet
    const nameExists = existingUsers.some(user => 
      user.name && user.name.toLowerCase().trim() === userData.fullName.toLowerCase().trim()
    )
    if (nameExists) {
      riskScore += 40
      reasons.push("Nom complet déjà utilisé")
    }

    // 3. Vérifier les IP suspectes avec historique
    if (ip) {
      // Vérifier si cette IP a déjà créé des comptes
      const existingUsersFromIP = existingUsers.filter(user => {
        const userIPs = this.getUserIPs(user.id)
        return userIPs.includes(ip)
      })

      if (existingUsersFromIP.length > 0) {
        riskScore += 60
        reasons.push(`Cette IP a déjà créé ${existingUsersFromIP.length} compte(s)`)
        
        // Si plus de 2 comptes depuis la même IP, bloquer immédiatement
        if (existingUsersFromIP.length >= 2) {
          riskScore += 40
          reasons.push("Multiples comptes depuis la même IP - FRAUDE ÉVIDENTE")
        }
      }

      // Vérifier si l'IP est déjà bloquée
      if (blockedIPs.has(ip)) {
        riskScore += 80
        reasons.push("IP déjà bloquée pour activités frauduleuses")
      }
    }

    // 4. Vérifier les patterns de noms suspects
    if (this.isSuspiciousName(userData.fullName)) {
      riskScore += 30
      reasons.push("Nom complet suspect")
    }

    // 5. Vérifier la rapidité de l'inscription (moins de 30 secondes = suspect)
    const signupTime = Date.now() - (userData.startTime || Date.now())
    if (signupTime < 30000) {
      riskScore += 25
      reasons.push("Inscription trop rapide - Possible bot")
    }

    // 6. Vérifier le fingerprint du navigateur
    if (userData.userAgent) {
      const suspiciousPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /headless/i, /phantom/i, /selenium/i
      ]
      
      if (suspiciousPatterns.some(pattern => pattern.test(userData.userAgent))) {
        riskScore += 70
        reasons.push("UserAgent suspect - Bot détecté")
      }
    }

    // 7. Vérifier les tentatives multiples depuis le même appareil
    if (ip && userData.userAgent) {
      const deviceKey = `${ip}-${userData.userAgent.slice(0, 50)}`
      const previousAttempts = deviceFingerprints.get(deviceKey) || []
      
      if (previousAttempts.length >= 3) {
        riskScore += 90
        reasons.push("Trop de tentatives depuis le même appareil")
      }
    }

    // Déterminer le niveau de risque
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW"
    let allowed = true
    let action: string | undefined

    if (riskScore >= 80) {
      riskLevel = "CRITICAL"
      allowed = false
      action = "BLOCK_PERMANENTLY"
    } else if (riskScore >= 60) {
      riskLevel = "HIGH"
      allowed = false
      action = "BLOCK_AND_REPORT"
    } else if (riskScore >= 40) {
      riskLevel = "MEDIUM"
      allowed = false
      action = "REQUIRE_MANUAL_REVIEW"
    }

    return {
      riskScore,
      riskLevel,
      reasons,
      allowed,
      action
    }
  }

  // Enregistrer une connexion
  recordConnection(user: User, ip?: string, userAgent?: string): void {
    const phoneHash = this.hashPhone(user.phone || '')
    const record: ConnectionRecord = {
      userId: user.id,
      timestamp: Date.now(),
      ip,
      userAgent,
      phoneHash,
      isActive: true
    }

    if (!connectionRecords.has(user.id)) {
      connectionRecords.set(user.id, [])
    }
    connectionRecords.get(user.id)!.push(record)

    // Enregistrer le fingerprint de l'appareil
    if (ip && userAgent) {
      const deviceKey = `${ip}-${userAgent.slice(0, 50)}`
      if (!deviceFingerprints.has(deviceKey)) {
        deviceFingerprints.set(deviceKey, [])
      }
      deviceFingerprints.get(deviceKey)!.push(user.id)
    }

    // Nettoyer les anciennes connexions (plus de 24h)
    this.cleanupOldConnections(user.id)

    // Détecter les connexions multiples
    this.detectMultipleConnections(user.id, phoneHash)
  }

  // Obtenir les IPs associées à un utilisateur
  private getUserIPs(userId: string): string[] {
    const connections = connectionRecords.get(userId) || []
    const ips = new Set<string>()
    
    connections.forEach(conn => {
      if (conn.ip) {
        ips.add(conn.ip)
      }
    })
    
    return Array.from(ips)
  }

  // Bloquer un utilisateur pour fraude
  blockUserForFraud(userId: string, reason: string, ip?: string, phoneHash?: string): void {
    const existingFraudulentUser = fraudulentUsers.get(userId)
    const phoneHashes = existingFraudulentUser?.phoneHashes || []
    
    if (phoneHash && !phoneHashes.includes(phoneHash)) {
      phoneHashes.push(phoneHash)
    }

    const fraudulentUser: FraudulentUser = {
      userId,
      ip,
      phoneHashes,
      userAgent: existingFraudulentUser?.userAgent,
      blockedAt: Date.now(),
      blockReason: reason,
      riskScore: existingFraudulentUser?.riskScore || 100,
      attempts: (existingFraudulentUser?.attempts || 0) + 1
    }

    fraudulentUsers.set(userId, fraudulentUser)
    suspiciousUsers.add(userId)

    // Bloquer l'IP si fournie
    if (ip) {
      blockedIPs.add(ip)
    }

    // Bloquer tous les hashes de téléphone associés
    phoneHashes.forEach(hash => {
      this.blockVoteFromPhoneHash(hash, "Fraude détectée - Utilisateur bloqué", userId)
    })

    console.warn(`🚨 UTILISATEUR BLOQUÉ POUR FRAUDE: ${userId} - ${reason}`)
  }

  // Bloquer les votes depuis un hash de téléphone
  private blockVoteFromPhoneHash(phoneHash: string, reason: string, blockedBy: string): void {
    const block: VoteBlock = {
      phoneHash,
      blockedUntil: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 jours
      reason,
      blockedBy
    }
    
    voteBlocks.set(phoneHash, block)
  }

  // Vérifier si un utilisateur est bloqué
  isUserBlocked(userId: string): boolean {
    return fraudulentUsers.has(userId)
  }

  // Vérifier si un utilisateur peut voter (vérification ULTRA stricte)
  canUserVoteStrict(userId: string, ip?: string, phone?: string, userAgent?: string): { allowed: boolean; reason?: string; riskLevel?: string } {
    // 1. Vérifier si l'utilisateur est explicitement bloqué
    if (fraudulentUsers.has(userId)) {
      const fraudUser = fraudulentUsers.get(userId)!
      return { 
        allowed: false, 
        reason: `Utilisateur bloqué pour fraude: ${fraudUser.blockReason}`,
        riskLevel: "CRITICAL"
      }
    }

    // 2. Vérifier si l'IP est bloquée
    if (ip && blockedIPs.has(ip)) {
      return { 
        allowed: false, 
        reason: "Adresse IP bloquée pour activités frauduleuses",
        riskLevel: "HIGH"
      }
    }

    // 3. Vérifier le hash de téléphone
    if (phone) {
      const phoneHash = this.hashPhone(phone)
      const voteBlock = voteBlocks.get(phoneHash)
      
      if (voteBlock && voteBlock.blockedUntil > Date.now()) {
        return { 
          allowed: false, 
          reason: `Vote bloqué: ${voteBlock.reason} jusqu'au ${new Date(voteBlock.blockedUntil).toLocaleDateString()}`,
          riskLevel: "HIGH"
        }
      }
    }

    // 4. Vérification CROISÉE des appareils et IPs
    if (ip) {
      // Vérifier tous les utilisateurs qui se sont connectés depuis cette IP
      const usersFromSameIP = this.getUsersFromIP(ip)
      
      // Si d'autres utilisateurs depuis cette IP sont déjà bloqués pour fraude
      const blockedUsersFromIP = usersFromSameIP.filter(uid => fraudulentUsers.has(uid))
      if (blockedUsersFromIP.length > 0) {
        return {
          allowed: false,
          reason: "Cette adresse IP est associée à des comptes frauduleux",
          riskLevel: "CRITICAL"
        }
      }

      // Vérifier les fingerprints d'appareil
      if (userAgent) {
        const deviceKey = `${ip}-${userAgent.slice(0, 50)}`
        const deviceUsers = deviceFingerprints.get(deviceKey) || []
        
        // Si cet appareil a été utilisé pour créer plusieurs comptes
        if (deviceUsers.length > 1) {
          return {
            allowed: false,
            reason: "Cet appareil a été utilisé pour créer plusieurs comptes",
            riskLevel: "HIGH"
          }
        }
      }
    }

    // 5. Vérification des patterns de vote suspects
    const userVotes = voteRecords.get(userId) || []
    const now = Date.now()
    
    // Vérifier les votes très récents (possibilité de bot)
    const veryRecentVotes = userVotes.filter(v => (now - v.timestamp) < 60 * 1000) // 1 minute
    if (veryRecentVotes.length >= 2) {
      return {
        allowed: false,
        reason: "Activité de vote suspecte détectée - Veuillez patienter",
        riskLevel: "MEDIUM"
      }
    }

    return { allowed: true }
  }

  // Obtenir tous les utilisateurs connectés depuis une IP
  private getUsersFromIP(ip: string): string[] {
    const users: string[] = []
    
    for (const [userId, connections] of connectionRecords.entries()) {
      const hasIP = connections.some(conn => conn.ip === ip)
      if (hasIP) {
        users.push(userId)
      }
    }
    
    return users
  }

  // Vérifier si un téléphone a déjà voté aujourd'hui (peu importe le compte)
  hasPhoneVotedToday(phone: string): { voted: boolean; userId?: string; timestamp?: number } {
    const phoneHash = this.hashPhone(phone)
    
    for (const [userId, votes] of voteRecords.entries()) {
      const phoneVotes = votes.filter(v => 
        v.phoneHash === phoneHash && 
        (Date.now() - v.timestamp) < 24 * 60 * 60 * 1000
      )
      
      if (phoneVotes.length > 0) {
        return {
          voted: true,
          userId,
          timestamp: phoneVotes[0].timestamp
        }
      }
    }
    
    return { voted: false }
  }

  // Bloquer automatiquement un utilisateur et tous ses comptes associés
  blockUserAndAssociates(userId: string, reason: string, ip?: string, phone?: string): void {
    // Bloquer l'utilisateur principal
    const phoneHash = phone ? this.hashPhone(phone) : undefined
    this.blockUserForFraud(userId, reason, ip, phoneHash)

    // Si on a une IP, bloquer tous les utilisateurs associés
    if (ip) {
      const associatedUsers = this.getUsersFromIP(ip)
      associatedUsers.forEach(associatedUserId => {
        if (associatedUserId !== userId) {
          this.blockUserForFraud(associatedUserId, `Associé à un compte frauduleux: ${reason}`, ip)
        }
      })
    }

    // Si on a un téléphone, bloquer tous les votes associés
    if (phoneHash) {
      this.blockVoteFromPhoneHash(phoneHash, `Fraude détectée: ${reason}`, userId)
    }
  }

  // Enregistrer un vote
  recordVote(userId: string, candidateId: string, ip?: string, userAgent?: string, phone?: string): { allowed: boolean; reason?: string } {
    // 0. Vérification anti-fraude ULTRA stricte AVANT d'autoriser le vote
    const fraudCheck = this.canUserVoteStrict(userId, ip, phone, userAgent)
    if (!fraudCheck.allowed) {
      return fraudCheck
    }

    // Vérification supplémentaire : est-ce que ce téléphone a déjà voté aujourd'hui ?
    if (phone) {
      const phoneVoteCheck = this.hasPhoneVotedToday(phone)
      if (phoneVoteCheck.voted && phoneVoteCheck.userId !== userId) {
        // Ce téléphone a déjà voté depuis un autre compte aujourd'hui !
        this.blockUserAndAssociates(userId, "Tentative de vote multiple avec le même téléphone", ip, phone)
        return { 
          allowed: false, 
          reason: "Ce numéro de téléphone a déjà été utilisé pour voter aujourd'hui depuis un autre compte" 
        }
      }
    }

    const userRecords = voteRecords.get(userId) || []
    const phoneHash = this.hashPhone(phone || '')

    // 1. Vérifier si l'utilisateur a déjà voté pour ce candidat
    const existingVote = userRecords.find(record => 
      record.candidateId === candidateId && 
      (Date.now() - record.timestamp) < 24 * 60 * 60 * 1000 // 24 heures
    )
    if (existingVote) {
      return { allowed: false, reason: "Vous avez déjà voté pour ce candidat aujourd'hui" }
    }

    // 2. Vérifier le nombre total de votes aujourd'hui
    const todayVotes = userRecords.filter(record => 
      (Date.now() - record.timestamp) < 24 * 60 * 60 * 1000
    )
    if (todayVotes.length >= 10) { // Maximum 10 votes par jour
      return { allowed: false, reason: "Limite de votes journalière atteinte" }
    }

    // 3. Vérifier les votes depuis la même IP
    if (ip) {
      const sameIPVotes = this.getVotesFromIP(ip, 24 * 60 * 60 * 1000)
      if (sameIPVotes >= 5) { // Maximum 5 votes par IP par jour
        return { allowed: false, reason: "Trop de votes depuis cette adresse IP" }
      }
    }

    // 4. Vérifier les votes avec le même hash de téléphone
    if (phoneHash) {
      const samePhoneVotes = this.getVotesFromPhoneHash(phoneHash, 24 * 60 * 60 * 1000)
      if (samePhoneVotes >= 3) { // Maximum 3 votes par hash de téléphone par jour
        return { allowed: false, reason: "Activité de vote suspecte détectée" }
      }
    }

    // 5. Vérifier les patterns de vote suspects (vote rapide multiple)
    const recentVotes = userRecords.filter(record => 
      (Date.now() - record.timestamp) < 5 * 60 * 1000 // 5 minutes
    )
    if (recentVotes.length >= 3) {
      // Détecter comportement de vote automatisé
      this.blockUserForFraud(userId, "Vote automatisé détecté", ip, phoneHash)
      return { allowed: false, reason: "Comportement de vote automatisé détecté - Compte bloqué" }
    }

    // Enregistrer le vote
    const voteRecord: VoteRecord = {
      userId,
      candidateId,
      timestamp: Date.now(),
      ip,
      userAgent,
      phoneHash: phoneHash || ''
    }

    if (!voteRecords.has(userId)) {
      voteRecords.set(userId, [])
    }
    voteRecords.get(userId)!.push(voteRecord)

    return { allowed: true }
  }

  // Détecter les connexions multiples
  private detectMultipleConnections(userId: string, phoneHash: string): void {
    const userConnections = connectionRecords.get(userId) || []
    const activeConnections = userConnections.filter(conn => 
      conn.isActive && (Date.now() - conn.timestamp) < 30 * 60 * 1000 // 30 minutes
    )

    if (activeConnections.length > 3) {
      console.warn(`🚨 Connexions multiples détectées pour l'utilisateur ${userId}`)
      suspiciousUsers.add(userId)
    }

    // Vérifier les connexions avec le même hash de téléphone
    let samePhoneConnections = 0
    for (const [uid, connections] of connectionRecords.entries()) {
      const activeSamePhone = connections.filter(conn => 
        conn.phoneHash === phoneHash && 
        conn.isActive && 
        (Date.now() - conn.timestamp) < 30 * 60 * 1000
      )
      samePhoneConnections += activeSamePhone.length
    }

    if (samePhoneConnections > 1) {
      console.warn(`🚨 Même numéro de téléphone utilisé depuis plusieurs comptes: ${phoneHash}`)
      suspiciousUsers.add(userId)
    }
  }

  // Normaliser le numéro de téléphone
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^223/, '').replace(/^0/, '')
  }

  // Vérifier si un nom est suspect
  private isSuspiciousName(name: string): boolean {
    const suspiciousPatterns = [
      /^[A-Z]{2,}\s[A-Z]{2,}$/, // Initiales uniquement
      /^.{1,2}$/, // Noms trop courts
      /^.{50,}$/, // Noms trop longs
      /(.)\1{3,}/, // Caractères répétés
      /\d{4,}/, // Plus de 3 chiffres
      /test|demo|fake|admin|user/i // Mots suspects
    ]
    return suspiciousPatterns.some(pattern => pattern.test(name))
  }

  // Obtenir le hash de téléphone d'un utilisateur
  private getUserPhoneHash(userId: string): string | undefined {
    // En production, récupérer depuis la base de données
    return undefined
  }

  // Obtenir les votes depuis une IP
  private getVotesFromIP(ip: string, timeWindow: number): number {
    let count = 0
    for (const [userId, votes] of voteRecords.entries()) {
      const recentVotes = votes.filter(vote => 
        vote.ip === ip && 
        (Date.now() - vote.timestamp) < timeWindow
      )
      count += recentVotes.length
    }
    return count
  }

  // Obtenir les votes depuis un hash de téléphone
  private getVotesFromPhoneHash(phoneHash: string, timeWindow: number): number {
    let count = 0
    for (const [userId, votes] of voteRecords.entries()) {
      const recentVotes = votes.filter(vote => 
        vote.phoneHash === phoneHash && 
        (Date.now() - vote.timestamp) < timeWindow
      )
      count += recentVotes.length
    }
    return count
  }

  // Nettoyer les anciennes connexions
  private cleanupOldConnections(userId: string): void {
    const connections = connectionRecords.get(userId) || []
    const recentConnections = connections.filter(conn => 
      (Date.now() - conn.timestamp) < 24 * 60 * 60 * 1000 // 24 heures
    )
    connectionRecords.set(userId, recentConnections)
  }

  // Obtenir les statistiques de fraude
  getFraudStats(): {
    totalVotes: number
    suspiciousUsers: number
    blockedIPs: number
    fraudulentUsers: number
    averageRiskScore: number
    blockedVotes: number
    deviceFingerprints: number
  } {
    let totalVotes = 0
    for (const votes of voteRecords.values()) {
      totalVotes += votes.length
    }

    const blockedVotesCount = Array.from(voteBlocks.values()).length

    return {
      totalVotes,
      suspiciousUsers: suspiciousUsers.size,
      blockedIPs: blockedIPs.size,
      fraudulentUsers: fraudulentUsers.size,
      averageRiskScore: 0, // Calculer si nécessaire
      blockedVotes: blockedVotesCount,
      deviceFingerprints: deviceFingerprints.size
    }
  }

  // Obtenir les détails des utilisateurs frauduleux
  getFraudulentUsers(): FraudulentUser[] {
    return Array.from(fraudulentUsers.values())
  }

  // Obtenir les votes bloqués
  getBlockedVotes(): VoteBlock[] {
    return Array.from(voteBlocks.values())
  }

  // Nettoyer les anciens blocs (plus de 30 jours)
  cleanupExpiredBlocks(): void {
    const now = Date.now()
    for (const [phoneHash, block] of voteBlocks.entries()) {
      if (block.blockedUntil <= now) {
        voteBlocks.delete(phoneHash)
        console.log(`🔓 Blocage expiré pour le hash: ${phoneHash}`)
      }
    }
  }

  // Détecter automatiquement les fraudes basées sur les patterns
  detectSuspiciousPatterns(): void {
    const now = Date.now()
    const suspiciousPatterns: string[] = []

    // 1. Détecter les comptes créés rapidement depuis la même IP
    for (const [deviceKey, userIds] of deviceFingerprints.entries()) {
      if (userIds.length >= 3) {
        suspiciousPatterns.push(`Multiples comptes (${userIds.length}) depuis l'appareil: ${deviceKey}`)
        
        // Bloquer tous les utilisateurs de cet appareil
        userIds.forEach(userId => {
          this.blockUserForFraud(userId, "Multiples comptes depuis le même appareil")
        })
      }
    }

    // 2. Détecter les votes anormalement rapides
    for (const [userId, votes] of voteRecords.entries()) {
      const recentVotes = votes.filter(v => (now - v.timestamp) < 10 * 60 * 1000) // 10 minutes
      
      if (recentVotes.length >= 5) {
        suspiciousPatterns.push(`Votes rapides détectés: ${recentVotes.length} votes en 10 minutes pour l'utilisateur ${userId}`)
        this.blockUserForFraud(userId, "Activité de vote anormalement rapide")
      }
    }

    // 3. Détecter les patterns de vote coordonnés
    const candidateVotes = new Map<string, VoteRecord[]>()
    for (const votes of voteRecords.values()) {
      for (const vote of votes) {
        if (!candidateVotes.has(vote.candidateId)) {
          candidateVotes.set(vote.candidateId, [])
        }
        candidateVotes.get(vote.candidateId)!.push(vote)
      }
    }

    for (const [candidateId, votes] of candidateVotes.entries()) {
      const recentVotes = votes.filter(v => (now - v.timestamp) < 5 * 60 * 1000) // 5 minutes
      
      if (recentVotes.length >= 10) {
        suspiciousPatterns.push(`Vote coordonné détecté: ${recentVotes.length} votes pour ${candidateId} en 5 minutes`)
        
        // Bloquer les IPs impliquées
        const ips = new Set(recentVotes.map(v => v.ip).filter(Boolean) as string[])
        ips.forEach(ip => {
          blockedIPs.add(ip)
        })
      }
    }

    if (suspiciousPatterns.length > 0) {
      console.warn("🚨 PATTERNS SUSPECTS DÉTECTÉS:", suspiciousPatterns)
    }
  }

  // Bloquer une IP
  blockIP(ip: string): void {
    blockedIPs.add(ip)
    console.log(`🚫 IP bloquée: ${ip}`)
  }

  // Marquer un utilisateur comme suspect
  markUserAsSuspicious(userId: string): void {
    suspiciousUsers.add(userId)
    console.log(`🚨 Utilisateur marqué comme suspect: ${userId}`)
  }

  // Vérifier si un utilisateur est suspect
  isUserSuspicious(userId: string): boolean {
    return suspiciousUsers.has(userId)
  }

  // Vérifier si une IP est bloquée
  isIPBlocked(ip: string): boolean {
    return blockedIPs.has(ip)
  }
}

// Fonctions utilitaires pour l'intégration
export const antiFraud = AntiFraudSystem.getInstance()

export function validateSignup(userData: any, existingUsers: User[], ip?: string): FraudDetection {
  return antiFraud.detectSignupFraud(userData, existingUsers, ip)
}

export function recordUserConnection(user: User, ip?: string, userAgent?: string): void {
  antiFraud.recordConnection(user, ip, userAgent)
}

export function validateVote(userId: string, candidateId: string, ip?: string, userAgent?: string, phone?: string): { allowed: boolean; reason?: string } {
  return antiFraud.recordVote(userId, candidateId, ip, userAgent, phone)
}

export function canUserVote(userId: string, ip?: string, phone?: string): { allowed: boolean; reason?: string } {
  return antiFraud.canUserVoteStrict(userId, ip, phone)
}

export function hasPhoneVotedToday(phone: string) {
  return antiFraud.hasPhoneVotedToday(phone)
}

export function blockUserForFraud(userId: string, reason: string, ip?: string, phone?: string): void {
  const phoneHash = phone ? antiFraud['hashPhone'](phone) : undefined
  antiFraud.blockUserForFraud(userId, reason, ip, phoneHash)
}

export function isUserBlocked(userId: string): boolean {
  return antiFraud.isUserBlocked(userId)
}

export function getFraudStats() {
  return antiFraud.getFraudStats()
}

export function getBlockedVotes() {
  return antiFraud.getBlockedVotes()
}

export function getFraudulentUsers() {
  return antiFraud.getFraudulentUsers()
}

export function detectSuspiciousPatterns() {
  return antiFraud.detectSuspiciousPatterns()
}
