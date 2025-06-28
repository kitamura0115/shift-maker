"use client";

import React, { useState, useRef } from 'react';
import { Upload, FileText, BarChart3, Calendar, AlertTriangle, Users, Clock, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

// データ型定義
interface Staff {
  name: string;
  availableDate: string;
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
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSVファイル読み込み処理
  const handleCSVFile = async (file: File): Promise<Staff[]> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];

    const data: Staff[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 6) {
        data.push({
          name: values[0]?.trim() || `スタッフ${i}`,
          availableDate: values[1]?.trim() || '2025-07-01',
          availableTime: values[2]?.trim() || '09:00-18:00',
          skill: values[3]?.trim() || '一般',
          goodWith: values[4]?.trim() || '',
          badWith: values[5]?.trim() || ''
        });
      }
    }
    return data;
  };

  // XLSXファイル読み込み処理
  const handleXLSXFile = async (file: File): Promise<Staff[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 最初のシートを取得
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // シートをJSONに変換
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '' 
          }) as string[][];
          
          if (jsonData.length < 2) {
            resolve([]);
            return;
          }

          const staff: Staff[] = [];
          
          // ヘッダー行をスキップして、データ行から処理
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length >= 6) {
              staff.push({
                name: String(row[0] || `スタッフ${i}`).trim(),
                availableDate: String(row[1] || '2025-07-01').trim(),
                availableTime: String(row[2] || '09:00-18:00').trim(),
                skill: String(row[3] || '一般').trim(),
                goodWith: String(row[4] || '').trim(),
                badWith: String(row[5] || '').trim()
              });
            }
          }
          
          resolve(staff);
        } catch (error) {
          console.error('XLSX読み込みエラー:', error);
          setUploadStatus('ファイルの読み込みに失敗しました。正しい形式のファイルかご確認ください。');
          resolve([]);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // ファイルアップロード処理（CSV・XLSX両方対応）
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('ファイルを読み込み中...');
    
    try {
      let data: Staff[] = [];
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        data = await handleCSVFile(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        data = await handleXLSXFile(file);
      } else {
        setUploadStatus('サポートされていないファイル形式です。CSV または XLSX ファイルをアップロードしてください。');
        return;
      }

      if (data.length > 0) {
        setStaffData(data);
        setUploadStatus(`✅ ${data.length}名のスタッフデータを読み込みました。`);
        
        // 3秒後にステータスメッセージを消す
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        setUploadStatus('❌ データが見つかりませんでした。ファイルの形式をご確認ください。');
      }
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      setUploadStatus('❌ ファイルの読み込みに失敗しました。');
    }
  };

  // サンプルデータ追加
  const addSampleData = () => {
    const sampleData: Staff[] = [
      {
        name: '田中浩',
        availableDate: '2025-07-09',
        availableTime: '09:00-12:00',
        skill: '新人',
        goodWith: '後藤くみ子',
        badWith: '遠藤学'
      },
      {
        name: '佐藤くみ子',
        availableDate: '2025-07-11',
        availableTime: '12:00-15:00',
        skill: '新人',
        goodWith: '斉藤幹',
        badWith: '加藤陽子'
      },
      {
        name: '中村春香',
        availableDate: '2025-07-31',
        availableTime: '15:00-18:00',
        skill: '新人',
        goodWith: '高橋真綾',
        badWith: '石川くみ子'
      },
      {
        name: '中村学',
        availableDate: '2025-07-10',
        availableTime: '09:00-12:00',
        skill: '新人',
        goodWith: '中村七夏',
        badWith: '鈴木拓真'
      },
      {
        name: '佐藤健一',
        availableDate: '2025-07-06',
        availableTime: '09:00-12:00',
        skill: '店長',
        goodWith: '伊藤裕太',
        badWith: '中村健一'
      }
    ];
    setStaffData(sampleData);
    setUploadStatus('✅ サンプルデータを読み込みました。');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  // 日付範囲を取得する関数
  const getDateRange = (staffData: Staff[]) => {
    if (staffData.length === 0) return [];
    
    const dates = staffData.map(staff => new Date(staff.availableDate));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const dateRange = [];
    const currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateRange;
  };

  // 時間帯が重複するかチェックする関数
  const isTimeOverlap = (staffTime: string, shiftTime: string) => {
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const [staffStart, staffEnd] = staffTime.split('-').map(parseTime);
    const [shiftStart, shiftEnd] = shiftTime.split('-').map(parseTime);

    return staffStart < shiftEnd && staffEnd > shiftStart;
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

    const dateRange = getDateRange(staffData);
    
    const newSchedules: DaySchedule[] = dateRange.map(date => {
      const dateStr = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      
      const dayName = date.toLocaleDateString('ja-JP', { weekday: 'long' });
      
      return {
        date: `${dateStr} (${dayName})`,
        shifts: timeSlots.map(timeSlot => {
          // その日に勤務可能なスタッフをフィルタリング
          const availableStaff = staffData.filter(staff => {
            const staffDate = new Date(staff.availableDate);
            const isDateMatch = staffDate.toDateString() === date.toDateString();
            const isTimeMatch = isTimeOverlap(staff.availableTime, timeSlot);
            return isDateMatch && isTimeMatch;
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
      };
    });

    setSchedules(newSchedules);
    setIsGenerating(false);
    setShowAlert(true);
    
    // 3秒後にアラートを自動で消す
    setTimeout(() => setShowAlert(false), 3000);
  };

  // ダッシュボード用統計計算
  const calculateStats = () => {
    const statsData = staffData.map(staff => {
      const totalShifts = schedules.reduce((total, day) => 
        total + day.shifts.filter(shift => 
          shift.assignedStaff.some(s => s.name === staff.name)
        ).length, 0
      );
      
      return {
        name: staff.name,
        totalShifts,
        averageHoursPerDay: totalShifts * 3,
        workDays: Math.ceil(totalShifts / 2)
      };
    });

    return statsData;
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {activeTab === 'input' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">スタッフデータの入力</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV・XLSXファイルをアップロード
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    <strong>対応形式:</strong> CSV (.csv) または Excel (.xlsx, .xls)<br/>
                    <strong>データ形式:</strong> スタッフ名、勤務可能日、出勤可能時間帯、スキル、相性の良いスタッフ、相性の悪いスタッフの順で記載してください<br/>
                    <strong>日付形式:</strong> 2025-07-09 のような形式で入力してください<br/>
                    <strong>時間形式:</strong> 09:00-12:00 のような形式で入力してください
                  </p>
                  
                  {uploadStatus && (
                    <div className={`mt-2 p-2 rounded-md text-sm ${
                      uploadStatus.includes('✅') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : uploadStatus.includes('❌')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {uploadStatus}
                    </div>
                  )}
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

            {staffData.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  登録済みスタッフ ({staffData.length}名)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スタッフ名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務可能日</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出勤可能時間帯</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スキル</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相性良</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相性悪</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffData.map((staff, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.availableDate}</td>
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
                        <p className="text-sm font-medium text-gray-500">総シフト数</p>
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
                        <p className="text-sm font-medium text-gray-500">平均充足率</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {schedules.length > 0 ? Math.round(
                            (schedules.reduce((total, day) => 
                              total + day.shifts.reduce((dayTotal, shift) => 
                                dayTotal + (shift.assignedStaff.length / shift.requiredStaff), 0), 0) / 
                            schedules.reduce((total, day) => total + day.shifts.length, 0)) * 100
                          ) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">スタッフ別勤務統計</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スタッフ名</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">シフト数</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勤務時間</th>
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