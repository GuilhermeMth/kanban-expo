import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ColumnId = 'todo' | 'progress' | 'done';

type Card = {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
  tag: string;
  tagColor: string;
};

const columns: { id: ColumnId; title: string; color: string; tint: string }[] = [
  { id: 'todo', title: 'A fazer', color: '#F5A623', tint: '#FFF4E1' },
  { id: 'progress', title: 'Em progresso', color: '#4D7CFE', tint: '#EAF0FF' },
  { id: 'done', title: 'Concluído', color: '#32B979', tint: '#E5F8EF' },
];

const initialCards: Card[] = [
  {
    id: '1',
    title: 'Mapear jornada do cliente',
    description: 'Entender os principais pontos de contato e oportunidades.',
    column: 'todo',
    tag: 'Pesquisa',
    tagColor: '#8662E8',
  },
  {
    id: '2',
    title: 'Criar wireframes da home',
    description: 'Explorar duas opções de hierarquia para a página inicial.',
    column: 'todo',
    tag: 'Design',
    tagColor: '#E9853F',
  },
  {
    id: '3',
    title: 'Configurar analytics',
    description: 'Adicionar eventos essenciais para acompanhar ativação.',
    column: 'progress',
    tag: 'Produto',
    tagColor: '#238DAD',
  },
  {
    id: '4',
    title: 'Revisar textos de onboarding',
    description: 'Ajustar tom de voz e deixar as instruções mais claras.',
    column: 'done',
    tag: 'Conteúdo',
    tagColor: '#DB4D83',
  },
];

const columnWidth = Math.min(Dimensions.get('window').width - 48, 330);

function CardItem({
  card,
  onEdit,
  onDelete,
  onMove,
}: {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (x: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const panResponder = useMemo(
    () =>
      PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        setDragging(true);
      },
      onPanResponderMove: (_, gesture) => setDragPosition({ x: gesture.dx, y: gesture.dy }),
      onPanResponderRelease: (_, gesture) => {
        onMove(gesture.moveX);
        setDragging(false);
        setDragPosition({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        setDragPosition({ x: 0, y: 0 });
      },
      }),
    [onMove],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.card, dragging && styles.cardDragging, { transform: [{ translateX: dragPosition.x }, { translateY: dragPosition.y }] }]}>
      <View style={styles.cardTopRow}>
        <View style={[styles.tag, { backgroundColor: `${card.tagColor}18` }]}>
          <View style={[styles.tagDot, { backgroundColor: card.tagColor }]} />
          <Text style={[styles.tagText, { color: card.tagColor }]}>{card.tag}</Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel="Remover card">
          <Ionicons name="trash-outline" size={16} color="#A7ADBA" />
        </Pressable>
      </View>
      <Pressable onPress={onEdit} style={styles.cardBody}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {card.description || 'Sem descrição'}
        </Text>
      </Pressable>
      <View style={styles.cardFooter}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>VC</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={17} color="#A7ADBA" />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [cards, setCards] = useState(initialCards);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const totalDone = cards.filter((card) => card.column === 'done').length;

  const groupedCards = useMemo(
    () =>
      columns.reduce<Record<ColumnId, Card[]>>(
        (result, column) => ({ ...result, [column.id]: cards.filter((card) => card.column === column.id) }),
        { todo: [], progress: [], done: [] },
      ),
    [cards],
  );

  const openCreate = () => {
    setEditingCard(null);
    setDraftTitle('');
    setDraftDescription('');
    setModalVisible(true);
  };

  const openEdit = (card: Card) => {
    setEditingCard(card);
    setDraftTitle(card.title);
    setDraftDescription(card.description);
    setModalVisible(true);
  };

  const saveCard = () => {
    const title = draftTitle.trim();
    if (!title) {
      Alert.alert('Título necessário', 'Escreva um título para o card.');
      return;
    }
    if (editingCard) {
      setCards((current) =>
        current.map((card) =>
          card.id === editingCard.id ? { ...card, title, description: draftDescription.trim() } : card,
        ),
      );
    } else {
      setCards((current) => [
        ...current,
        {
          id: Date.now().toString(),
          title,
          description: draftDescription.trim(),
          column: 'todo',
          tag: 'Novo',
          tagColor: '#6F7C92',
        },
      ]);
    }
    setModalVisible(false);
  };

  const removeCard = (card: Card) => {
    Alert.alert('Remover card?', `“${card.title}” será removido do quadro.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setCards((current) => current.filter((item) => item.id !== card.id)) },
    ]);
  };

  const moveCard = (card: Card, x: number) => {
    const index = Math.max(0, Math.min(columns.length - 1, Math.floor(x / (columnWidth + 16))));
    const nextColumn = columns[index].id;
    if (nextColumn !== card.column) {
      setCards((current) => current.map((item) => (item.id === card.id ? { ...item, column: nextColumn } : item)));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TERÇA, 24 DE SETEMBRO</Text>
            <Text style={styles.heading}>Meu espaço de trabalho</Text>
          </View>
          <Pressable style={styles.profile} accessibilityLabel="Perfil">
            <Text style={styles.profileText}>VC</Text>
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <View>
            <Text style={styles.boardTitle}>Visão geral do projeto</Text>
            <Text style={styles.boardSubtitle}>Organize suas tarefas e mantenha o ritmo.</Text>
          </View>
          <Pressable style={styles.addButton} onPress={openCreate}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Novo card</Text>
          </Pressable>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}><Text style={styles.statValue}>{cards.length}</Text><Text style={styles.statLabel}>cards no total</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}><Text style={[styles.statValue, { color: '#32B979' }]}>{totalDone}</Text><Text style={styles.statLabel}>concluídos</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${cards.length ? (totalDone / cards.length) * 100 : 0}%` }]} /></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board} decelerationRate="fast">
          {columns.map((column) => (
            <View key={column.id} style={[styles.column, { width: columnWidth }]}>
              <View style={styles.columnHeader}>
                <View style={styles.columnName}>
                  <View style={[styles.columnDot, { backgroundColor: column.color }]} />
                  <Text style={styles.columnTitle}>{column.title}</Text>
                  <View style={[styles.count, { backgroundColor: column.tint }]}><Text style={[styles.countText, { color: column.color }]}>{groupedCards[column.id].length}</Text></View>
                </View>
                <Pressable onPress={openCreate} hitSlop={10}><Ionicons name="add" size={20} color="#A7ADBA" /></Pressable>
              </View>
              <View style={styles.columnLine} />
              {groupedCards[column.id].map((card) => (
                <CardItem key={card.id} card={card} onEdit={() => openEdit(card)} onDelete={() => removeCard(card)} onMove={(x) => moveCard(card, x)} />
              ))}
              {groupedCards[column.id].length === 0 && <Text style={styles.emptyColumn}>Arraste um card para cá</Text>}
            </View>
          ))}
        </ScrollView>
        <Text style={styles.hint}><Ionicons name="hand-left-outline" size={14} color="#A7ADBA" /> Segure e arraste um card para mover entre colunas</Text>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCard ? 'Editar card' : 'Novo card'}</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}><Ionicons name="close" size={24} color="#687386" /></Pressable>
            </View>
            <Text style={styles.inputLabel}>TÍTULO</Text>
            <TextInput value={draftTitle} onChangeText={setDraftTitle} placeholder="Ex.: Preparar apresentação" placeholderTextColor="#A7ADBA" style={styles.input} autoFocus />
            <Text style={styles.inputLabel}>DESCRIÇÃO</Text>
            <TextInput value={draftDescription} onChangeText={setDraftDescription} placeholder="Adicione mais detalhes..." placeholderTextColor="#A7ADBA" style={[styles.input, styles.textArea]} multiline textAlignVertical="top" />
            <Pressable style={styles.saveButton} onPress={saveCard}><Text style={styles.saveButtonText}>{editingCard ? 'Salvar alterações' : 'Adicionar card'}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FC' },
  screen: { flex: 1 },
  content: { paddingBottom: 32 },
  header: { backgroundColor: '#19253D', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#93A0B9', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  heading: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  profile: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8B36D', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#41506D' },
  profileText: { color: '#5B3A18', fontSize: 12, fontWeight: '800' },
  toolbar: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  boardTitle: { color: '#202B42', fontSize: 18, fontWeight: '800' },
  boardSubtitle: { color: '#8993A5', fontSize: 12, marginTop: 4 },
  addButton: { backgroundColor: '#4D7CFE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  stats: { marginHorizontal: 24, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 22, shadowColor: '#1B2840', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statItem: { minWidth: 70 },
  statValue: { color: '#202B42', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#9AA2B0', fontSize: 10, marginTop: 3 },
  statDivider: { width: 1, height: 30, backgroundColor: '#EEF0F4', marginHorizontal: 14 },
  progressTrack: { height: 6, backgroundColor: '#EEF1F6', borderRadius: 5, flex: 1, marginLeft: 16, overflow: 'hidden' },
  progressFill: { backgroundColor: '#32B979', height: '100%', borderRadius: 5 },
  board: { paddingHorizontal: 24, gap: 16 },
  column: { backgroundColor: '#EFF1F6', borderRadius: 14, padding: 14, minHeight: 320 },
  columnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  columnName: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  columnDot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { color: '#38445B', fontSize: 13, fontWeight: '800' },
  count: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  countText: { fontSize: 11, fontWeight: '800' },
  columnLine: { height: 1, backgroundColor: '#DDE1E9', marginTop: 13, marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 11, padding: 13, marginBottom: 10, shadowColor: '#26364F', shadowOpacity: 0.07, shadowRadius: 7, elevation: 2 },
  cardDragging: { shadowOpacity: 0.2, shadowRadius: 16, elevation: 7, zIndex: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4, gap: 5 },
  tagDot: { width: 5, height: 5, borderRadius: 3 },
  tagText: { fontSize: 9, fontWeight: '800' },
  cardBody: { paddingVertical: 10 },
  cardTitle: { color: '#26344E', fontSize: 14, lineHeight: 19, fontWeight: '800' },
  cardDescription: { color: '#8B94A5', fontSize: 11, lineHeight: 16, marginTop: 5 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F0F1F5', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#D9E3FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#4D7CFE', fontSize: 8, fontWeight: '800' },
  emptyColumn: { color: '#A7ADBA', fontSize: 12, textAlign: 'center', paddingTop: 35 },
  hint: { color: '#A7ADBA', fontSize: 11, textAlign: 'center', marginTop: 18 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16, 25, 43, 0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { color: '#202B42', fontSize: 20, fontWeight: '800' },
  inputLabel: { color: '#8B94A5', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E6EE', borderRadius: 10, color: '#26344E', fontSize: 14, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 18 },
  textArea: { height: 90 },
  saveButton: { backgroundColor: '#4D7CFE', alignItems: 'center', borderRadius: 10, paddingVertical: 14, marginTop: 2 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
