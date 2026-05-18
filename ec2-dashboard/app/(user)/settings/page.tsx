/** SettingsPage — redirige automáticamente a la sección de seguridad */
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/security');
}
