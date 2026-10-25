import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ApplyForm from './ApplyForm'

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/visa-services/${id}/apply`)}`)
  }

  const { data: p } = await supabase
    .from('visa_products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!p || p.is_hidden) notFound()

  const roe = p.currency === 'PKR' ? 1 : Number(p.roe || 0)
  const visaFee = Number(p.visa_fee) * roe
  const serviceFee = Number(p.service_fee) * roe

  return (
    <ApplyForm
      userId={user.id}
      product={{
        id: p.id,
        name: p.name,
        visa_type: p.visa_type,
        visaFee,
        serviceFee,
        perPerson: visaFee + serviceFee,
      }}
    />
  )
}
