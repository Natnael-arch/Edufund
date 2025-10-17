import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useSwitchChain } from 'wagmi';
import { questApi, rewardApi, Quest } from '../services/api';
import { mezoTestnet } from '../wagmi.config';
import { claimRewardFromContract } from '../services/contracts';
import { distributeFromPool } from '../services/poolContracts';
import toast from 'react-hot-toast';

function QuestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showClaimButton, setShowClaimButton] = useState(false);
  const [claimSignature, setClaimSignature] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<any>(null);
  
  const isOnMezo = chain?.id === mezoTestnet.id;

  useEffect(() => {
    loadQuest();
  }, [id]);

  const loadQuest = async () => {
    try {
      setLoading(true);
      const quests = await questApi.getQuests();
      const foundQuest = quests.find(q => q.id === id);
      if (foundQuest) {
        setQuest(foundQuest);
      } else {
        setError('Quest not found');
      }
    } catch (err) {
      setError('Failed to load quest');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteQuest = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!id) return;

    try {
      setCompleting(true);
      setError(null);
      const response = await questApi.completeQuest(id, address);
      
      // Store all claim data from backend
      if (response.signature) {
        setClaimSignature(response.signature);
        setClaimData(response);
        console.log('✅ Received claim data:', {
          useCompanyPool: response.useCompanyPool,
          hasPool: !!response.poolId
        });
      } else {
        console.warn('⚠️ No signature received from backend');
      }
      
      setCompleted(true);
      setShowClaimButton(true);
      
      if (response.fundingPool) {
        toast.success(`Quest completed! Claim your reward from ${response.fundingPool.companyName}!`);
      } else {
        toast.success('Quest completed! Now claim your reward.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to complete quest';
      toast.error(errorMsg);
      setError(errorMsg);
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const handleClaimReward = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check if on Mezo network
    if (!isOnMezo) {
      toast.error('Please switch to Mezo network to claim rewards');
      // Optionally auto-switch:
      try {
        await switchChain({ chainId: mezoTestnet.id });
      } catch (err) {
        console.error('Failed to switch network:', err);
      }
      return;
    }

    if (!id || !quest) return;

    try {
      setClaiming(true);
      setError(null);

      // Check if we have signature from backend
      if (!claimSignature || !claimData) {
        toast.error('No signature available. Please complete the quest first.');
        return;
      }
      
      let txHash: string;
      
      // Use appropriate contract based on funding source
      if (claimData.useCompanyPool && claimData.poolIdBytes) {
        // Company-funded quest: Use Company Pool contract
        toast.loading('Claiming from company pool on blockchain...', { duration: 3000 });
        
        txHash = await distributeFromPool(
          claimData.poolId,
          claimData.poolIdBytes,
          address,
          claimData.questIdBytes,
          claimSignature
        );
        
        toast.success('Company pool distribution confirmed!', { duration: 2000 });
      } else {
        // Platform quest: Use Student Rewards contract
        toast.loading('Claiming from platform rewards...', { duration: 3000 });
        
        txHash = await claimRewardFromContract(id, quest.reward, claimSignature);
        
        toast.success('Platform reward confirmed!', { duration: 2000 });
      }
      
      // Record the claim in backend with real tx hash
      await rewardApi.claimReward(address, id, txHash);
      
      const fundedBy = claimData.fundingPool 
        ? ` from ${claimData.fundingPool.companyName}` 
        : '';
      
      toast.success(`Successfully claimed ${quest.reward} mUSD${fundedBy}! Check your wallet! 💰`, {
        duration: 5000,
      });
      
      // Redirect to rewards page
      setTimeout(() => {
        navigate('/rewards');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to claim reward';
      toast.error(errorMsg);
      setError(errorMsg);
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Quest not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-mezo font-semibold hover:underline"
        >
          ← Back to Quests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="text-gray-600 hover:text-gray-900 mb-6 flex items-center"
      >
        ← Back to Quests
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quest.title}</h1>
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
              {quest.difficulty}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Reward</div>
            <div className="text-3xl font-bold text-bitcoin">{quest.reward} mUSD</div>
          </div>
        </div>

        <div className="prose max-w-none mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-700 mb-6">{quest.description}</p>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">Quest Content</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{quest.content}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {completed && showClaimButton ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Quest completed! Claim your reward below.
            </div>
            <button
              onClick={handleClaimReward}
              disabled={claiming || !isOnMezo}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
                claiming || !isOnMezo
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-bitcoin to-mezo hover:opacity-90'
              }`}
            >
              {!isConnected
                ? 'Connect Wallet to Claim'
                : !isOnMezo
                ? 'Switch to Mezo Network to Claim'
                : claiming
                ? 'Claiming Reward...'
                : `Claim ${quest.reward} mUSD Reward`}
            </button>
          </div>
        ) : (
          <button
            onClick={handleCompleteQuest}
            disabled={completing || completed || !isConnected}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
              completing || completed || !isConnected
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-bitcoin to-mezo hover:opacity-90'
            }`}
          >
            {!isConnected
              ? 'Connect Wallet to Complete'
              : completing
              ? 'Completing...'
              : completed
              ? 'Completed! ✓'
              : 'Complete Quest'}
          </button>
        )}
      </div>
    </div>
  );
}

export default QuestDetails;
