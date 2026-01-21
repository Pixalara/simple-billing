import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { INDIAN_STATES } from '../constants'

export default function Dashboard() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [savedLogo, setSavedLogo] = useState(null)
  const navigate = useNavigate()
  
  const { register, handleSubmit, setValue, watch } = useForm()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) navigate('/login')
      else fetchProfile(session.user.id)
    })
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setValue('business_name', data.business_name)
      setValue('state', data.state)
      setValue('gstin', data.gstin)
      setValue('business_email', data.business_email)
      setValue('business_phone', data.business_phone)
      setValue('website', data.website)
      
      if (data.logo_url) setSavedLogo(data.logo_url)
    }
    setLoading(false)
  }

  // Handle Logo Upload to Supabase Storage
  const handleLogoUpload = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to "logos" bucket
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      // 3. Save URL to Database immediately
      const { error: dbError } = await supabase
        .from('users')
        .update({ logo_url: publicUrl })
        .eq('id', session.user.id)

      if (dbError) throw dbError

      setSavedLogo(publicUrl)
      alert('Logo uploaded successfully!')

    } catch (error) {
      alert('Error uploading logo: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const updateProfile = async (formData) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          ...formData,
          // We don't overwrite logo_url here as it's handled separately
        })

      if (error) throw error
      alert('Business details saved!')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">
            Sign Out
          </button>
        </div>

        {/* Business Profile Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-4 text-gray-800">Business Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT COL: Logo Upload */}
            <div className="md:col-span-1 flex flex-col items-center">
                <div className="w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-4 relative group">
                    {savedLogo ? (
                        <img src={savedLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                        <span className="text-gray-400 font-medium">No Logo</span>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-semibold">Change Logo</p>
                    </div>
                </div>
                
                <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md cursor-pointer hover:bg-blue-100 font-medium w-full text-center transition">
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        disabled={uploading}
                        className="hidden" 
                    />
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">Recommended: Square PNG/JPG</p>
            </div>

            {/* RIGHT COL: Details Form */}
            <div className="md:col-span-2">
                <form onSubmit={handleSubmit(updateProfile)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Business Name */}
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name *</label>
                        <input 
                            {...register('business_name', { required: true })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Pixalara Traders"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Business Email</label>
                        <input 
                            {...register('business_email')}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="billing@company.com"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                        <input 
                            {...register('business_phone')}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Website */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                        <input 
                            {...register('website')}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="www.pixalara.io"
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                        <select 
                            {...register('state', { required: true })} 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    {/* GSTIN */}
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">GSTIN (Optional)</label>
                        <input 
                            {...register('gstin')}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="29ABCDE1234F1Z5"
                        />
                    </div>

                    <div className="col-span-2 mt-4 pt-4 border-t">
                        <button 
                            type="submit"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-bold w-full md:w-auto transition shadow-md"
                        >
                            Save Details
                        </button>
                    </div>
                </form>
            </div>
          </div>
        </div>

        {/* Invoice Actions */}
        <div className="bg-white p-6 rounded-lg shadow text-center">
            <h2 className="text-xl font-semibold mb-4">Ready to bill?</h2>
            <button 
              onClick={() => navigate('/create-invoice')} 
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-bold shadow-lg transform transition hover:scale-105"
            >
                + Create New Invoice
            </button>
        </div>
      </div>
    </div>
  )
}