'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, BarChart3, Calendar, AlertTriangle, Users, Clock, TrendingUp } from 'lucide-react';

// データ型定義
interface Staff {
  name: string;
  availableTime: string;
  skill: string;
  goodWith: string;
  badWith: string;
}

interface ShiftSlot {
  timeSlot: string;
  requiredStaff: number;
  assignedStaff: Staff[];
  alerts: string[];
}

interface DaySchedule {
  date: string;
  shifts: ShiftSlot[];
}

const ShiftSchedulerApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [requiredStaffCount, setRequiredStaffCount] = useState(2);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSVファイル読み込み処理
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return;

    const headers = lines[0].split(',');
    const data: Staff[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 5) {
        data.push({
          name: values[0] || `スタッフ${i}`,
          availableTime: values[1] || '平日・土日、午前9時-午後6時',
          skill: values[2] || '一般',
          goodWith: values[3] || '',
          badWith: values[4] || ''
        });
      }
    }

    setStaffData(data);
  };

  // サンプルデータ追加
  const addSampleData = () => {
    const sampleData: Staff[] = [
      {
        name: '田中太郎',
        availableTime: '平日のみ、午前10時-午後4時',
        skill: '店長',
        goodWith: '佐藤花子',
        badWith: '山田次郎'
      },
      {
        name: '佐藤花子',
        availableTime: '土日と平日、午後1時-午後5時',
        skill: '副店長',
        goodWith: '田中太郎',
        badWith: '鈴木一郎'
      },
      {
        name: '山田次郎',
        availableTime: '土日・祝日のみ、午前9時-夜間',
        skill: '一般',
        goodWith: '佐藤花子',
        badWith: '田中太郎'
      },
      {
        name: '鈴木一郎',
        availableTime: '平日・土日、午後2時-午後6時',
        skill: '新人',
        goodWith: '田中花子',
        badWith: '佐藤次郎'
      }
    ];
    setStaffData(sampleData);
  };

  // シフト生成処理
  const generateSchedule = async () => {
    setIsGenerating(true);
    
    // ローディング効果のため少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const timeSlots = [
      '09:00-12:00',
      '12:00-15:00', 
      '15:00-18:00',
      '18:00-21:00'
    ];

    const days = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
    
    const newSchedules: DaySchedule[] = days.map(day => ({
      date: day,
      shifts: timeSlots.map(timeSlot => {
        const availableStaff = staffData.filter(staff => {
          // 簡単な可用性チェック（実際はより複雑な条件が必要）
          return staff.availableTime.includes('平日') || staff.availableTime.includes('土日');
        });

        const assignedStaff = availableStaff.slice(0, Math.min(requiredStaffCount, availableStaff.length));
        const alerts = [];

        if (assignedStaff.length < requiredStaffCount) {
          alerts.push(`スタッフ不足: ${requiredStaffCount - assignedStaff.length}名不足`);
        }

        // 相性チェック
        for (let i = 0; i < assignedStaff.length; i++) {
          for (let j = i + 1; j < assignedStaff.length; j++) {
            if (assignedStaff[i].badWith === assignedStaff[j].name || 
                assignedStaff[j].badWith === assignedStaff[i].name) {
              alerts.push(`相性注意: ${assignedStaff[i].name}と${assignedStaff[j].name}`);
            }
          }
        }

        return {
          timeSlot,
          requiredStaff: requiredStaffCount,
          assignedStaff,
          alerts
        };
      })
    }));

    setSchedules(newSchedules);
    setIsGenerating(false);
    setShowAlert(true);
    
    // 3秒後にアラートを自動で消す
    setTimeout(() => setShowAlert(false), 3000);
  };

  // ダッシュボード用統計計算
  const calculateStats = () => {
    const stats = staffData.map(staff => {
      const totalShifts = schedules.reduce((total, day) => 
        total + day.shifts.filter(shift => 
          shift.assignedStaff.some(s => s.name === staff.name)
        ).length, 0
      );
      
      return {
        name: staff.name,
        totalShifts,
        averageHoursPerDay: totalShifts * 3, // 各シフト3時間と仮定
        workDays: Math.ceil(totalShifts / 2) // 1日平均2シフトと仮定
      };
    });

    return stats;
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              シフト表作成アプリ
            </h1>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'input', name: 'データ入力', icon: Upload },
              { id: 'schedule', name: 'シフト表', icon: FileText },
              { id: 'dashboard', name: 'ダッシュボード', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 成功アラート */}
        {showAlert && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md flex items-center gap-2 animate-pulse">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong className="font-semibold">シフト表が正常に生成されました！</strong>
              <p className="text-sm">シフト表タブで確認できます。</p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-auto flex-shrink-0 text-green-500 hover:text-green-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* データ入力タブ */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">スタッフデータの入力</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSVファイルをアップロード
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    スタッフ名、勤務可能時間、スキル、相性の良いスタッフ、相性の悪いスタッフの順で記載してください
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={addSampleData}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    サンプルデータを使用
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    必要スタッフ数（時間帯あたり）
                  </label>
                  <select
                    value={requiredStaffCount}
                    onChange={(e) => setRequiredStaffCount(Number(e.target.value))}
                    className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}名</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={generateSchedule}
                  disabled={staffData.length === 0 || isGenerating}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      生成中...
                    </>
                  ) : (
                    'シフト表を生成'
                  )}
                </button>
              </div>
            </div>

            {/* スタッフデータ表示 */}
            {staffData.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">登録済みスタッフ</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スタッフ名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務可能時間</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スキル</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相性良</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相性悪</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffData.map((staff, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.availableTime}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.skill}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.goodWith}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.badWith}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* シフト表タブ */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {schedules.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">シフト表が生成されていません</h3>
                <p className="text-gray-500">データ入力タブでスタッフデータを登録し、シフト表を生成してください。</p>
              </div>
            ) : (
              schedules.map(daySchedule => (
                <div key={daySchedule.date} className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{daySchedule.date}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {daySchedule.shifts.map(shift => (
                      <div key={shift.timeSlot} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{shift.timeSlot}</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">必要: {shift.requiredStaff}名</p>
                          <div className="space-y-1">
                            {shift.assignedStaff.map(staff => (
                              <div key={staff.name} className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">{staff.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{staff.skill}</span>
                              </div>
                            ))}
                          </div>
                          {shift.alerts.map(alert => (
                            <div key={alert} className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">{alert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ダッシュボードタブ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {stats.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ダッシュボードデータがありません</h3>
                <p className="text-gray-500">シフト表を生成すると、スタッフの勤務統計が表示されます。</p>
              </div>
            ) : (
              <>
                {/* 統計カード */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">総スタッフ数</p>
                        <p className="text-2xl font-semibold text-gray-900">{staffData.length}名</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">週間総シフト数</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {schedules.reduce((total, day) => total + day.shifts.length, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">平均シフト充足率</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Math.round(
                            (schedules.reduce((total, day) => 
                              total + day.shifts.reduce((dayTotal, shift) => 
                                dayTotal + (shift.assignedStaff.length / shift.requiredStaff), 0), 0) / 
                            schedules.reduce((total, day) => total + day.shifts.length, 0)) * 100
                          )}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* スタッフ別統計 */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">スタッフ別勤務統計</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スタッフ名</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">週間シフト数</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">週間勤務時間</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出勤日数</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.map(stat => (
                          <tr key={stat.name}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.totalShifts}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.averageHoursPerDay}時間</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.workDays}日</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ShiftSchedulerApp;