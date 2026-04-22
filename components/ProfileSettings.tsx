import React, { useState, useEffect } from 'react';
import { profileService, Profile, weeklyGoalService, WeeklyGoal } from '../services/firebaseService';

const ProfileSettings: React.FC = () => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [crp, setCrp] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>({ label: 'novos leads', target: 10, current: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [result, goalResult] = await Promise.all([
          profileService.get(),
          weeklyGoalService.get(),
        ]);
        if (result.success && result.data) {
          setName(result.data.name);
          setSpecialty(result.data.specialty);
          setCrp(result.data.crp);
          setPhotoURL(result.data.photoURL || '');
          setBio(result.data.bio || '');
          setReportEmail(result.data.reportEmail || '');
        }
        if (goalResult.success) setWeeklyGoal(goalResult.data);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    if (reportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportEmail.trim())) {
      setError('Informe um email válido para receber o relatório semanal.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const [result] = await Promise.all([
        profileService.save({
          name: name.trim(),
          specialty: specialty.trim(),
          crp: crp.trim(),
          photoURL: photoURL.trim(),
          bio: bio.trim(),
          reportEmail: reportEmail.trim(),
        }),
        weeklyGoalService.save(weeklyGoal),
      ]);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Erro ao salvar. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span>⚙️</span>
          Configurações do Perfil
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {saved && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
              ✅ Perfil salvo com sucesso!
            </div>
          )}

          {/* Photo Preview */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center overflow-hidden shrink-0 border-4 border-purple-100">
              {photoURL ? (
                <img src={photoURL} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'FM'}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{name || 'Seu Nome'}</h3>
              <p className="text-sm text-gray-500">{specialty || 'Especialidade'}</p>
              <p className="text-xs text-gray-400">{crp || 'CRP XX/XXXXX'}</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fernanda Abreu Mangia"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: Neuropsicóloga, Psicóloga Clínica"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* CRP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CRP</label>
            <input
              type="text"
              value={crp}
              onChange={(e) => setCrp(e.target.value)}
              placeholder="Ex: CRP 05/12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL da Foto de Perfil</label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Cole o link de uma imagem armazenada externamente.</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Descrição</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Breve descrição que pode ser usada em posts gerados por IA..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Esses dados serão usados pela IA ao gerar conteúdo personalizado.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email para relatório semanal</label>
            <input
              type="email"
              value={reportEmail}
              onChange={(e) => setReportEmail(e.target.value)}
              placeholder="Ex: admin@fernandapsicologia.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Esse email fica apenas no dashboard privado e será usado pelo resumo semanal automático.</p>
          </div>

          <hr className="border-gray-200" />

          {/* Meta da Semana */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Meta da Semana</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição da meta</label>
                <input
                  type="text"
                  value={weeklyGoal.label}
                  onChange={(e) => setWeeklyGoal((g) => ({ ...g, label: e.target.value }))}
                  placeholder="Ex: novos leads, consultas agendadas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta (total)</label>
                <input
                  type="number"
                  min={1}
                  value={weeklyGoal.target}
                  onChange={(e) => setWeeklyGoal((g) => ({ ...g, target: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progresso atual</label>
                <input
                  type="number"
                  min={0}
                  value={weeklyGoal.current}
                  onChange={(e) => setWeeklyGoal((g) => ({ ...g, current: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <div className="w-full">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(Math.round((weeklyGoal.current / (weeklyGoal.target || 1)) * 100), 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{weeklyGoal.current} de {weeklyGoal.target} ({Math.round((weeklyGoal.current / (weeklyGoal.target || 1)) * 100)}%)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info card */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Dica:</strong> As informações do perfil (nome, especialidade, CRP) são utilizadas pela IA para gerar conteúdo
          personalizado e profissional para suas redes sociais. O email do relatório semanal não aparece na landing page pública.
        </p>
      </div>
    </div>
  );
};

export default ProfileSettings;
