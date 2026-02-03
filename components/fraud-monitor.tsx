"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, AlertTriangle, Users, Ban, Activity, TrendingUp, Eye, Clock, Smartphone, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFraudStats, getFraudulentUsers, getBlockedVotes, detectSuspiciousPatterns, blockUserForFraud, isUserBlocked } from "@/lib/anti-fraud"

export function FraudMonitor() {
  const [stats, setStats] = useState<any>(null)
  const [fraudulentUsers, setFraudulentUsers] = useState<any[]>([])
  const [blockedVotes, setBlockedVotes] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)

  const loadFraudData = () => {
    setStats(getFraudStats())
    setFraudulentUsers(getFraudulentUsers())
    setBlockedVotes(getBlockedVotes())
  }

  const performScan = () => {
    setIsScanning(true)
    detectSuspiciousPatterns()
    setTimeout(() => {
      loadFraudData()
      setLastScan(new Date())
      setIsScanning(false)
    }, 2000)
  }

  useEffect(() => {
    loadFraudData()
    const interval = setInterval(loadFraudData, 30000) // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval)
  }, [])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR')
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-50 border-red-200"
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200"
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-green-600 bg-green-50 border-green-200"
  }

  const getRiskLabel = (score: number) => {
    if (score >= 80) return "CRITIQUE"
    if (score >= 60) return "ÉLEVÉ"
    if (score >= 40) return "MOYEN"
    return "FAIBLE"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Centre Anti-Fraude</h2>
            <p className="text-muted-foreground">Monitoring et protection des votes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastScan && (
            <div className="text-sm text-muted-foreground">
              Dernier scan: {formatDate(lastScan.getTime())}
            </div>
          )}
          <Button 
            onClick={performScan} 
            disabled={isScanning}
            className="bg-red-500 hover:bg-red-600"
          >
            {isScanning ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Scan en cours...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Lancer scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border/50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">{stats.totalVotes}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border/50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs Bloqués</p>
                <p className="text-2xl font-bold text-red-500">{stats.fraudulentUsers}</p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border/50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">IPs Bloquées</p>
                <p className="text-2xl font-bold text-orange-500">{stats.blockedIPs}</p>
              </div>
              <Globe className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border/50 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Votes Bloqués</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.blockedVotes}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Utilisateurs Frauduleux */}
      <div className="bg-card border border-border/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-red-500" />
          Utilisateurs Frauduleux ({fraudulentUsers.length})
        </h3>
        
        {fraudulentUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun utilisateur frauduleux détecté
          </p>
        ) : (
          <div className="space-y-3">
            {fraudulentUsers.map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getRiskColor(user.riskScore)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">ID: {user.userId}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(user.riskScore)}`}>
                        {getRiskLabel(user.riskScore)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Raison:</strong> {user.blockReason}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Bloqué le:</strong> {formatDate(user.blockedAt)}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Tentatives:</strong> {user.attempts}
                    </p>
                    {user.ip && (
                      <p className="text-sm text-muted-foreground">
                        <strong>IP:</strong> {user.ip}
                      </p>
                    )}
                    {user.phoneHashes.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Téléphones:</strong> {user.phoneHashes.length} hash(s)
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(user.riskScore)}`}>
                      Score: {user.riskScore}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Votes Bloqués */}
      <div className="bg-card border border-border/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5 text-yellow-500" />
          Votes Bloqués ({blockedVotes.length})
        </h3>
        
        {blockedVotes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun vote bloqué
          </p>
        ) : (
          <div className="space-y-3">
            {blockedVotes.map((block, index) => (
              <motion.div
                key={block.phoneHash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border border-yellow-200 bg-yellow-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hash: {block.phoneHash}</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Raison:</strong> {block.reason}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Bloqué par:</strong> {block.blockedBy}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Expire le:</strong> {formatDate(block.blockedUntil)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">
                      {Math.ceil((block.blockedUntil - Date.now()) / (1000 * 60 * 60 * 24))} jours
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Alertes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-900">Conseils de Sécurité</h4>
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Effectuez des scans réguliers pour détecter les patterns suspects</li>
          <li>• Surveillez les utilisateurs avec un score de risque élevé</li>
          <li>• Les IPs bloquées empêchent toute nouvelle inscription</li>
          <li>• Les votes bloqués le restent pendant 30 jours minimum</li>
          <li>• Le système détecte automatiquement les comportements de vote automatisés</li>
        </ul>
      </div>
    </div>
  )
}
