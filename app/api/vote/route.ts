import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateVote, hasPhoneVotedToday, blockUserForFraud } from '@/lib/anti-fraud'

export async function POST(request: NextRequest) {
  try {
    const { userId, candidateId, phone } = await request.json()

    if (!userId || !candidateId) {
      return NextResponse.json({ error: 'ID utilisateur et ID candidat requis' }, { status: 400 })
    }

    // Obtenir l'IP de l'utilisateur
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Obtenir le User-Agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 1. Vérifier si l'utilisateur existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // 2. Vérification ANTI-FRAUDE ULTRA STRICTE
    const fraudCheck = validateVote(userId, candidateId, ip, userAgent, phone || user.phone)
    
    if (!fraudCheck.allowed) {
      // Log de la tentative de fraude
      console.warn(`🚨 TENTATIVE DE FRAUDE BLOQUÉE:`, {
        userId,
        candidateId,
        ip,
        phone: phone || user.phone,
        reason: fraudCheck.reason,
        timestamp: new Date().toISOString()
      })

      // Si c'est une tentative de vote multiple avec le même téléphone, bloquer immédiatement
      if (fraudCheck.reason?.includes('téléphone a déjà été utilisé')) {
        blockUserForFraud(userId, 'Tentative de vote multiple avec même téléphone', ip, phone || user.phone)
      }

      return NextResponse.json({ 
        error: fraudCheck.reason || 'Vote non autorisé',
        fraudDetected: true
      }, { status: 403 })
    }

    // 3. Vérification supplémentaire : est-ce que ce téléphone a déjà voté aujourd'hui ?
    const userPhone = phone || user.phone
    if (userPhone) {
      const phoneVoteCheck = hasPhoneVotedToday(userPhone)
      if (phoneVoteCheck.voted && phoneVoteCheck.userId !== userId) {
        // Ce téléphone a déjà voté depuis un autre compte aujourd'hui !
        console.error(`🚨 FRAUDE DÉTECTÉE: Le téléphone ${userPhone} a déjà voté depuis le compte ${phoneVoteCheck.userId}`)
        
        blockUserForFraud(userId, 'Tentative de vote multiple avec même téléphone', ip, userPhone)
        
        return NextResponse.json({ 
          error: 'Ce numéro de téléphone a déjà été utilisé pour voter aujourd\'hui depuis un autre compte',
          fraudDetected: true,
          blocked: true
        }, { status: 403 })
      }
    }

    // 4. Enregistrer le vote dans la base de données
    const { data: vote, error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({
        user_id: userId,
        candidate_id: candidateId,
        ip_address: ip,
        user_agent: userAgent,
        phone: userPhone,
        voted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (voteError) {
      console.error('Erreur lors de l\'enregistrement du vote:', voteError)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement du vote' }, { status: 500 })
    }

    // 5. Mettre à jour les statistiques du candidat
    await supabaseAdmin.rpc('increment_candidate_votes', { candidate_id: candidateId })

    // 6. Log du vote réussi
    console.log(`✅ VOTE ENREGISTRÉ:`, {
      voteId: vote.id,
      userId,
      candidateId,
      ip,
      phone: userPhone,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      vote: {
        id: vote.id,
        candidateId: vote.candidate_id,
        votedAt: vote.voted_at
      },
      message: 'Vote enregistré avec succès'
    })

  } catch (error) {
    console.error('Erreur lors du traitement du vote:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Obtenir les statistiques de vote d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 })
    }

    // Récupérer les votes de l'utilisateur
    const { data: votes, error } = await supabaseAdmin
      .from('votes')
      .select(`
        *,
        candidates (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .order('voted_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erreur lors de la récupération des votes:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des votes' }, { status: 500 })
    }

    // Statistiques
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayVotes = votes?.filter(v => new Date(v.voted_at) >= today) || []
    const totalVotes = votes?.length || 0

    return NextResponse.json({
      votes,
      stats: {
        totalVotes,
        todayVotes: todayVotes.length,
        canVote: todayVotes.length < 10 // Maximum 10 votes par jour
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des votes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
