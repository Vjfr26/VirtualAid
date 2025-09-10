import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register - VirtualAid',
  description: 'Join VirtualAid as a patient or doctor. Easy and secure registration to access quality medical services.',
  keywords: 'medical registration, create account, VirtualAid, medical services, patient, doctor',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjY3ZWVhIi8+CjxwYXRoIGQ9Ik0xMiA2VjE4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNNiAxMkgxOCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+',
        sizes: '32x32',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
