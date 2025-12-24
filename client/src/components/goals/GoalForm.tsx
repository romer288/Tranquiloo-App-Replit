import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GoalWithProgress } from '@/types/goals';
import { useLanguage } from '@/context/LanguageContext';

interface GoalFormProps {
  onSubmit: (goalData: any) => void;
  onCancel: () => void;
  initialData?: GoalWithProgress;
}

export const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    target_value: '',
    unit: '',
    frequency: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
const { t } = useLanguage();
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        target_value: initialData.target_value?.toString() || '',
        unit: initialData.unit || '',
        frequency: initialData.frequency || '',
        start_date: initialData.start_date || new Date().toISOString().split('T')[0],
        end_date: initialData.end_date || ''
      });
    }
  }, [initialData]);

  const categories = [
    { value: 'treatment', label: t('goalForm.treatment', 'Treatment') },
    { value: 'self-care', label: t('goalForm.selfCare', 'Self Care') },
    { value: 'therapy', label: t('goalForm.therapy', 'Therapy') },
    { value: 'mindfulness', label: t('goalForm.mindfulness', 'Mindfulness') },
    { value: 'exercise', label: t('goalForm.exercise', 'Exercise') },
    { value: 'social', label: t('goalForm.social', 'Social') },
    { value: 'work', label: t('goalForm.work', 'Work') },
    { value: 'sleep', label: t('goalForm.sleep', 'Sleep') },
    { value: 'nutrition', label: t('goalForm.nutrition', 'Nutrition') }
  ];
  
  const frequencies = [
    { value: 'daily', label: t('goalForm.daily', 'Daily') },
    { value: 'weekly', label: t('goalForm.weekly', 'Weekly') },
    { value: 'monthly', label: t('goalForm.monthly', 'Monthly') }
  ];
  


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData = {
      ...formData,
      target_value: formData.target_value ? Number(formData.target_value) : undefined,
      is_active: true
    };

    onSubmit(goalData);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md max-h-[60vh] md:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? t('goalForm.editGoal' ,'Edit Goal') : t('goalForm.createNewGoal' ,'Create New Goal')}</DialogTitle>
        </DialogHeader>
        
         
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t('goalForm.goalTitle' ,'Goal Title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('goalForm.placeholder' ,'e.g., Daily meditation practice')}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{t('goalForm.description' ,'Description (Optional)')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('goalForm.placeholderDescription' ,'Describe your goal in more detail')}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">{t('goalForm.category' ,'Category')}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('goalForm.selectCategory' ,'Select a category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="frequency">{t('goalForm.frequency' ,'Frequency')}</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('goalForm.howOften' ,'How often?')} />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_value">{t('goalForm.targetValue' ,'Target Value (Optional)')}</Label>
              <Input
                id="target_value"
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder={t('goalForm.placeholderTargetValue' ,'e.g., 10')}
              />
            </div>
            <div>
              <Label htmlFor="unit">{t('goalForm.unit' ,'Unit (Optional)')}</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder={t('goalForm.placeholderUnit' ,'e.g., minutes')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="start_date">{t('goalForm.startDate' ,'Start Date')}</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="end_date">{t('goalForm.endDate' ,'End Date (Optional)')}</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {initialData ? t('goalForm.updateGoal' ,'Update Goal') : t('goalForm.createGoal' ,'Create Goal')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('goalForm.cancel' ,'Cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};