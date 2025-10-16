import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useSwitchChain } from 'wagmi';
import { companyApi, Company, FundingPool } from '../../services/companyApi';
import { createPoolOnChain, getMUSDBalance } from '../../services/poolContracts';
import { mezoTestnet } from '../../wagmi.config';
import toast from 'react-hot-toast';

function CompanyDashboard() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [company, setCompany] = useState<Company | null>(null);
  const [pools, setPools] = useState<FundingPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [musdBalance, setMusdBalance] = useState<string>('0');

  useEffect(() => {
    const token = localStorage.getItem('companyToken');
    const companyData = localStorage.getItem('company');

    if (!token || !companyData) {
      navigate('/company/login');
      return;
    }

    setCompany(JSON.parse(companyData));
    loadPools(token);
  }, [navigate]);

  // Load mUSD balance when company data is loaded
  useEffect(() => {
    if (company?.walletAddress) {
      loadMUSDBalance();
    }
  }, [company]);

  const loadMUSDBalance = async () => {
    // Use company's registered wallet address, not connected wallet
    const companyWallet = company?.walletAddress;
    if (!companyWallet) return;
    
    try {
      const balance = await getMUSDBalance(companyWallet);
      setMusdBalance(balance);
    } catch (error) {
      console.error('Failed to load mUSD balance:', error);
    }
  };

  const isCorrectWallet = address?.toLowerCase() === company?.walletAddress?.toLowerCase();

  const loadPools = async (token: string) => {
    try {
      setLoading(true);
      const data = await companyApi.getPools(token);
      setPools(data.pools);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('companyToken');
        localStorage.removeItem('company');
        navigate('/company/login');
      } else {
        toast.error('Failed to load pools');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('companyToken');
    localStorage.removeItem('company');
    toast.success('Logged out successfully');
    navigate('/company/login');
  };

  const handleDeletePool = async (poolId: string) => {
    if (!confirm('Are you sure you want to close this pool and remove the quest?')) {
      return;
    }

    const token = localStorage.getItem('companyToken');
    if (!token) return;

    try {
      await companyApi.deletePool(poolId, token);
      toast.success('Pool closed and quest removed');
      loadPools(token);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete pool');
    }
  };

  const totalFunded = pools.reduce((sum, p) => sum + p.totalFund, 0);
  const totalRemaining = pools.reduce((sum, p) => sum + p.remainingBalance, 0);
  const totalStudents = pools.reduce((sum, p) => sum + (p._count?.rewards || 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{company?.name}</h1>
            <p className="text-gray-600">{company?.email}</p>
            <p className="text-sm text-gray-500 font-mono mt-1">{company?.walletAddress}</p>
            
            {/* mUSD Balance & Wallet Status */}
            <div className="mt-3 space-y-2">
              {/* Balance Display */}
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-bitcoin to-mezo text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <span className="text-sm font-semibold">
                    {parseFloat(musdBalance).toFixed(2)} mUSD
                  </span>
                  <button
                    onClick={loadMUSDBalance}
                    className="text-xs opacity-75 hover:opacity-100"
                    title="Refresh balance"
                  >
                    🔄
                  </button>
                </div>
                <a
                  href="https://app.mezo.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Get mUSD from Mezo →
                </a>
              </div>

              {/* Wallet Mismatch Warning */}
              {isConnected && !isCorrectWallet && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  <div className="font-semibold mb-1">⚠️ Wrong Wallet Connected</div>
                  <div className="text-xs mb-2">
                    Connected: {address?.slice(0, 10)}...{address?.slice(-8)}
                  </div>
                  <div className="text-xs mb-2">
                    Company wallet: {company?.walletAddress?.slice(0, 10)}...{company?.walletAddress?.slice(-8)}
                  </div>
                  <div className="text-xs">
                    Please connect wallet ending in <code className="bg-red-100 px-1 rounded">{company?.walletAddress?.slice(-8)}</code> to create pools
                  </div>
                </div>
              )}
              
              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  <div className="font-semibold mb-1">Connect Your Company Wallet</div>
                  <div className="text-xs">
                    Connect wallet <code className="bg-yellow-100 px-1 rounded">{company?.walletAddress?.slice(-8)}</code> to manage pools
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-bitcoin to-orange-400 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Total Funded</div>
          <div className="text-4xl font-bold">{totalFunded} mUSD</div>
        </div>

        <div className="bg-gradient-to-br from-mezo to-purple-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Remaining Balance</div>
          <div className="text-4xl font-bold">{totalRemaining} mUSD</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Students Rewarded</div>
          <div className="text-4xl font-bold">{totalStudents}</div>
        </div>
      </div>

      {/* Pools List */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Funding Pools</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-bitcoin to-mezo text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            + Create Pool
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
          </div>
        ) : pools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No funding pools yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-mezo font-semibold hover:underline"
            >
              Create your first pool →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool) => {
              const isEnded = (pool._count?.rewards || 0) >= pool.maxParticipants || 
                             pool.remainingBalance < pool.rewardPerStudent;
              
              return (
                <div
                  key={pool.id}
                  className={`border rounded-lg p-6 transition-colors ${
                    isEnded ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-mezo'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {pool.courseName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          pool.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pool.active ? 'Active' : 'Closed'}
                        </span>
                        {isEnded && pool.active && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Ended
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-bitcoin">
                        {pool.remainingBalance} mUSD
                      </div>
                      <div className="text-sm text-gray-600">
                        of {pool.totalFund} mUSD
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Reward/Student</div>
                      <div className="font-semibold">{pool.rewardPerStudent} mUSD</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Max Students</div>
                      <div className="font-semibold">{pool.maxParticipants}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Rewarded</div>
                      <div className="font-semibold">{pool._count?.rewards || 0}/{pool.maxParticipants}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <button
                      onClick={() => navigate(`/company/pool/${pool.id}`)}
                      className="text-mezo font-semibold hover:underline text-sm"
                    >
                      View Details →
                    </button>
                    
                    {isEnded && pool.active && (
                      <button
                        onClick={() => handleDeletePool(pool.id)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition"
                      >
                        🗑️ Remove Quest
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Pool Modal */}
      {showCreateModal && (
        <CreatePoolModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            const token = localStorage.getItem('companyToken');
            if (token) loadPools(token);
          }}
        />
      )}
    </div>
  );
}

// Create Pool Modal Component
function CreatePoolModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'blockchain'>('form');
  const [formData, setFormData] = useState({
    courseName: '',
    totalFund: '',
    rewardPerStudent: '',
    maxParticipants: '',
  });

  const isOnMezo = chain?.id === mezoTestnet.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isOnMezo) {
      toast.error('Please switch to Mezo Testnet');
      try {
        await switchChain({ chainId: mezoTestnet.id });
      } catch (err) {
        console.error('Failed to switch network:', err);
      }
      return;
    }

    const token = localStorage.getItem('companyToken');
    if (!token) {
      toast.error('Please login again');
      return;
    }

    try {
      setLoading(true);
      setStep('blockchain');

      // Step 1: Create pool in database
      toast.loading('Creating pool in database...', { duration: 2000 });
      const response = await companyApi.createPool(
        {
          courseName: formData.courseName,
          totalFund: parseInt(formData.totalFund),
          rewardPerStudent: parseInt(formData.rewardPerStudent),
          maxParticipants: parseInt(formData.maxParticipants),
        },
        token
      );

      // Step 2: Fund on blockchain
      toast.loading('Approving mUSD spending...', { duration: 3000 });
      
      const txHash = await createPoolOnChain(
        response.pool.id,
        formData.courseName,
        parseInt(formData.totalFund),
        parseInt(formData.rewardPerStudent),
        parseInt(formData.maxParticipants)
      );

      toast.success(`Pool funded on blockchain! TX: ${txHash.slice(0, 10)}...`, {
        duration: 5000,
      });

      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Failed to create pool');
      console.error('Pool creation error:', error);
    } finally {
      setLoading(false);
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Create Funding Pool</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              placeholder="Intro to Web3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Fund (mUSD)
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={formData.totalFund}
              onChange={(e) => setFormData({ ...formData, totalFund: e.target.value })}
              placeholder="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reward Per Student (mUSD)
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={formData.rewardPerStudent}
              onChange={(e) => setFormData({ ...formData, rewardPerStudent: e.target.value })}
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Participants
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              placeholder="20"
            />
          </div>

          {formData.totalFund && formData.rewardPerStudent && formData.maxParticipants && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="font-semibold text-blue-900 mb-2">Calculation:</div>
              <div className="text-blue-700">
                {formData.maxParticipants} students × {formData.rewardPerStudent} mUSD = {' '}
                {parseInt(formData.maxParticipants) * parseInt(formData.rewardPerStudent)} mUSD needed
              </div>
              {parseInt(formData.totalFund) < parseInt(formData.maxParticipants) * parseInt(formData.rewardPerStudent) && (
                <div className="text-red-600 mt-2">
                  ⚠️ Total fund is insufficient!
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-bitcoin to-mezo text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyDashboard;

