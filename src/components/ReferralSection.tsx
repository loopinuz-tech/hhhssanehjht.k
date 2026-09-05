import { useState, useEffect } from "react";
import { GiftIcon } from "@solar-icons/react/bold-duotone/gift";
import { StarIcon } from "@solar-icons/react/bold-duotone/star";
import { LinkIcon } from "@solar-icons/react/bold-duotone/link";
import { CopyIcon } from "@solar-icons/react/bold-duotone/copy";
import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { ShareIcon } from "@solar-icons/react/bold-duotone/share";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/bold-duotone/users-group-two-rounded";
import { UserPlusIcon } from "@solar-icons/react/bold-duotone/user-plus";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { UserIdIcon } from "@solar-icons/react/bold-duotone/user-id";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { rewriteStorageUrl } from "@/lib/storage";
import { uz } from "date-fns/locale";

interface Friend {
  full_name: string;
  avatar_url: string | null;
  joined_at: string;
  subscription_tier: string;
}

interface ReferrerInfo {
  full_name: string;
  referral_code: string;
  avatar_url: string | null;
}

interface ReferralData {
  referral_code: string;
  total_count: number;
  friends: Friend[];
  bonus_5_claimed: boolean;
  bonus_10_claimed: boolean;
}

const RED = "#E8192C";

export default function ReferralSection() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<ReferralData | null>(null);
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);

  const referralLink = data?.referral_code
    ? `${window.location.origin}/register?ref=${data.referral_code}`
    : "";

  useEffect(() => {
    if (!user) return;
    fetchReferrals();
  }, [user]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      // 1. Fetch current profile (referral_code & referred_by)
      const { data: myProfile } = await (supabase as any)
        .from("profiles")
        .select("referral_code, referred_by, referral_bonus_claimed_5, referral_bonus_claimed_10")
        .eq("user_id", user!.id)
        .single();

      // 2. If referred_by exists, fetch inviter's details
      if (myProfile?.referred_by) {
        const { data: inviter } = await (supabase as any)
          .from("profiles")
          .select("full_name, referral_code, avatar_url")
          .eq("user_id", myProfile.referred_by)
          .maybeSingle();

        if (inviter) {
          setReferrer({
            full_name: inviter.full_name || "Foydalanuvchi",
            referral_code: inviter.referral_code || "",
            avatar_url: inviter.avatar_url || null,
          });
        }
      } else {
        setReferrer(null);
      }

      // 3. Fetch friends invited by THIS user
      const { data: friends } = await (supabase as any)
        .from("profiles")
        .select("full_name, avatar_url, created_at, subscription_tier")
        .eq("referred_by", user!.id)
        .order("created_at", { ascending: false });

      setData({
        referral_code: myProfile?.referral_code || "",
        total_count: friends?.length || 0,
        friends: (friends || []).map((f: any) => ({
          full_name: f.full_name || "Foydalanuvchi",
          avatar_url: f.avatar_url,
          joined_at: f.created_at,
          subscription_tier: f.subscription_tier || "standart",
        })),
        bonus_5_claimed: myProfile?.referral_bonus_claimed_5 || false,
        bonus_10_claimed: myProfile?.referral_bonus_claimed_10 || false,
      });
    } catch (err) {
      console.error("Referral fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (type: "code" | "link") => {
    const text = type === "code" ? data?.referral_code || "" : referralLink;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2500);
    toast({ title: type === "code" ? "Kod nusxalandi!" : "Havola nusxalandi!" });
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "EduContest",
        text: `EduContest platformasida o'qishingizni tavsiya qilaman! Taklif kodim: ${data?.referral_code}`,
        url: referralLink,
      });
    } else {
      copyToClipboard("link");
    }
  };

  const applyReferralCode = async () => {
    if (!applyCode.trim() || !user) return;
    setApplying(true);
    try {
      // Find inviter by referral code
      const { data: inviterProfile } = await (supabase as any)
        .from("profiles")
        .select("user_id, full_name, referral_code")
        .eq("referral_code", applyCode.trim().toUpperCase())
        .maybeSingle();

      if (!inviterProfile) {
        toast({ title: "Xatolik", description: "Bunday referal kod topilmadi", variant: "destructive" });
        setApplying(false);
        return;
      }

      if (inviterProfile.user_id === user.id) {
        toast({ title: "Xatolik", description: "O'zingizning kodingizni kirita olmaysiz", variant: "destructive" });
        setApplying(false);
        return;
      }

      // Update referred_by in profile
      const { error: updateErr } = await (supabase as any)
        .from("profiles")
        .update({ referred_by: inviterProfile.user_id })
        .eq("user_id", user.id);

      if (updateErr) throw updateErr;

      toast({
        title: "Muvaffaqiyatli!",
        description: `Siz ${inviterProfile.full_name} ning taklif kodi orqali a'zo bo'ldingiz!`,
      });
      setApplyCode("");
      await fetchReferrals();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "Noma'lum xatolik", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const count = data?.total_count || 0;
  const progress5 = Math.min(100, (count / 5) * 100);
  const progress10 = Math.min(100, (count / 10) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E8192C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">

      {/* 1. How it works guide */}
      <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
            <GiftIcon size={24} className="text-[#E8192C]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Referal tizimi qanday ishlaydi?</h2>
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
              Do'stlaringizni EduContest platformasiga taklif qiling. Har bir ro'yxatdan o'tgan do'stingiz uchun Premium obuna bonuslariga ega bo'ling.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-extrabold text-[#E8192C] uppercase tracking-wider">1-QADAM</span>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Kodingizni ulashing</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Taklif havolasi yoki kodingizni nusxalang</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-extrabold text-[#E8192C] uppercase tracking-wider">2-QADAM</span>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Do'stingiz qo'shiladi</p>
                <p className="text-[11px] text-gray-400 mt-0.5">U sizning kodingiz orqali ro'yxatdan o'tadi</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-extrabold text-[#E8192C] uppercase tracking-wider">3-QADAM</span>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Bonusga ega bo'ling</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Bepul Premium obunalarni yutib oling</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Who referred me section */}
      <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <UserIdIcon size={20} className="text-[#E8192C]" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sizni taklif qilgan foydalanuvchi</h3>
        </div>

        {referrer ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {referrer.avatar_url ? (
                <img src={rewriteStorageUrl(referrer.avatar_url)} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                referrer.full_name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Taklif etuvchi</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{referrer.full_name}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-500/30">
              @{referrer.referral_code}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Siz platformaga mustaqil qo'shilgansiz. Agar sizni do'stingiz taklif qilgan bo'lsa, uning referal kodi orqali a'zo bo'lishingiz mumkin:
            </p>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={applyCode}
                onChange={e => setApplyCode(e.target.value.toUpperCase())}
                placeholder="Referal kodni kiriting"
                maxLength={12}
                className="flex-1 h-11 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold tracking-widest text-gray-900 dark:text-white uppercase focus:outline-none focus:border-[#E8192C]"
              />
              <button
                onClick={applyReferralCode}
                disabled={applying || !applyCode.trim()}
                className="px-5 h-11 rounded-xl bg-[#E8192C] text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                {applying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Qo'llash <AltArrowRightIcon size={16} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. My Referral Code & Link */}
      <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon size={20} className="text-[#E8192C]" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sizning taklif kodingiz va havolangiz</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 font-medium">Jami taklif qilinganlar: </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{count} kishi</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Referal kodingiz</p>
              <p className="text-lg font-bold tracking-widest text-gray-900 dark:text-white mt-0.5">
                {data?.referral_code || "——"}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard("code")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                copied === "code" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-300"
              }`}
            >
              {copied === "code" ? <CheckCircleIcon size={14} /> : <CopyIcon size={14} />}
              {copied === "code" ? "Nusxalandi" : "Kodni nusxalash"}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard("link")}
              className={`px-4 h-full min-h-[48px] rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                copied === "link" ? "bg-green-500 text-white" : "bg-[#E8192C] text-white hover:opacity-90"
              }`}
            >
              {copied === "link" ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
              {copied === "link" ? "Havola nusxalandi" : "Havolani nusxalash"}
            </button>
            <button
              onClick={shareLink}
              className="w-12 h-full min-h-[48px] rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center shrink-0"
              title="Ulashish"
            >
              <ShareIcon size={18} />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate flex-1 font-mono">{referralLink}</span>
        </div>
      </div>

      {/* 4. Progress Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl p-5 border transition-colors ${data?.bonus_5_claimed ? "border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A]"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${data?.bonus_5_claimed ? "bg-green-500 text-white" : "bg-amber-500/10 text-amber-500"}`}>
                <StarIcon size={18} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">5 ta do'st taklifi</p>
                <p className={`text-[11px] font-semibold ${data?.bonus_5_claimed ? "text-green-600" : "text-amber-600 dark:text-amber-400"}`}>
                  {data?.bonus_5_claimed ? "7 kun Premium qo'lga kiritildi" : "Mukofot: 7 kun Bepul Premium"}
                </p>
              </div>
            </div>
            {data?.bonus_5_claimed && <CheckCircleIcon size={20} className="text-green-500" />}
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${data?.bonus_5_claimed ? "bg-green-500" : "bg-[#E8192C]"}`} style={{ width: `${progress5}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 font-bold">{Math.min(count, 5)} / 5 kishi</p>
        </div>

        <div className={`rounded-2xl p-5 border transition-colors ${data?.bonus_10_claimed ? "border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-900/10" : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A]"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${data?.bonus_10_claimed ? "bg-purple-500 text-white" : "bg-purple-500/10 text-purple-500"}`}>
                <StarIcon size={18} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900 dark:text-white">10 ta do'st taklifi</p>
                <p className={`text-[11px] font-semibold ${data?.bonus_10_claimed ? "text-purple-600" : "text-purple-600 dark:text-purple-400"}`}>
                  {data?.bonus_10_claimed ? "14 kun Premium qo'lga kiritildi" : "Mukofot: 14 kun Bepul Premium"}
                </p>
              </div>
            </div>
            {data?.bonus_10_claimed && <CheckCircleIcon size={20} className="text-purple-500" />}
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${data?.bonus_10_claimed ? "bg-purple-500" : "bg-[#E8192C]"}`} style={{ width: `${progress10}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5 font-bold">{Math.min(count, 10)} / 10 kishi</p>
        </div>
      </div>

      {/* 5. Referred Friends List */}
      <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersGroupTwoRoundedIcon size={20} className="text-[#E8192C]" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Siz taklif qilgan do'stlaringiz</h3>
          </div>
          <span className="text-xs font-bold text-[#E8192C] bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">
            {count} ta a'zo
          </span>
        </div>

        {(!data?.friends || data.friends.length === 0) ? (
          <div className="py-12 text-center px-6">
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserPlusIcon size={24} className="text-gray-400" />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Hozircha taklif qilingan do'stlar yo'q</p>
            <p className="text-[11px] text-gray-400 mt-1">Taklif havolangizni do'stlaringizga yuboring va birinchi bonusga ega bo'ling!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {data.friends.map((friend, i) => {
              const initials = friend.full_name
                ?.split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "??";

              return (
                <div key={i} className="flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-xs font-bold text-[#E8192C] shrink-0 overflow-hidden">
                    {friend.avatar_url ? (
                      <img src={rewriteStorageUrl(friend.avatar_url)} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {friend.full_name || "Foydalanuvchi"}
                    </p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                      <ClockCircleIcon size={13} className="text-gray-400" />
                      Qo'shilgan sana: {format(new Date(friend.joined_at), "d MMMM yyyy", { locale: uz })}
                    </p>
                  </div>
                  {friend.subscription_tier === "premium" || friend.subscription_tier === "pro" ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-lg">
                      ✦ Premium
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                      Standart
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
