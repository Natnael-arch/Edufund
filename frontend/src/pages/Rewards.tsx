import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { rewardApi, RewardsResponse } from '../services/api';
import { mezoTestnet } from '../wagmi.config';

function Rewards() {
  const { address, isConnected, chain } = useAccount();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<RewardsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isOnMezo = chain?.id === mezoTestnet.id;
  
  // Get native balance (BTC on Mezo)
  const { data: btcBalance } = useBalance({
    address: address,
  });

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }
    if (address) {
      loadRewards();
    }
  }, [address, isConnected, navigate]);

  const loadRewards = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const data = await rewardApi.getRewards(address);
      setRewards(data);
      setError(null);
    } catch (err) {
      setError('Failed to load rewards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Rewards</h1>
        <p className="text-lg text-gray-600">Track your mUSD earnings from completed quests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-bitcoin to-orange-400 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Network Balance</div>
          <div className="text-4xl font-bold">
            {isOnMezo && btcBalance 
              ? `${parseFloat(btcBalance.formatted).toFixed(4)} ${btcBalance.symbol}`
              : '---'}
          </div>
          {!isOnMezo && (
            <div className="text-xs mt-2 opacity-75">Switch to Mezo network to view balance</div>
          )}
        </div>

        <div className="bg-gradient-to-br from-mezo to-purple-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Total Claimed</div>
          <div className="text-4xl font-bold">{rewards?.totalClaimed || 0} mUSD</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Rewards Claimed</div>
          <div className="text-4xl font-bold">{rewards?.count || 0}</div>
        </div>
      </div>

      {/* Wallet Info */}
      {address && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="text-sm text-gray-600 mb-1">Your Wallet Address</div>
          <div className="font-mono text-sm bg-gray-100 p-3 rounded-lg break-all">{address}</div>
        </div>
      )}

      {/* Rewards History */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between">
          <span>Reward History</span>
          {rewards && rewards.count > 0 && (
            <button
              onClick={loadRewards}
              className="text-sm bg-mezo text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Refresh
            </button>
          )}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {rewards && rewards.count === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't claimed any rewards yet</p>
            <button
              onClick={() => navigate('/')}
              className="text-mezo font-semibold hover:underline"
            >
              Browse Quests →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rewards?.rewards.map((reward) => (
              <div
                key={reward.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-mezo transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl font-bold text-bitcoin">{reward.amount} mUSD</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                        Claimed
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Claimed:</span>{' '}
                        {new Date(reward.claimedAt).toLocaleString()}
                      </div>
                      {reward.txHash && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Transaction:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {reward.txHash.slice(0, 10)}...{reward.txHash.slice(-8)}
                          </code>
                          <a
                            href={`https://testnet-explorer.mezo.org/tx/${reward.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mezo hover:underline text-xs"
                          >
                            View on Explorer ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isOnMezo && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Switch to Mezo Network</h3>
          <p className="text-blue-700">
            Use the Connect Wallet button to switch to Mezo network and view your balance. Mezo will be available in the network dropdown.
          </p>
        </div>
      )}
    </div>
  );
}

export default Rewards;

